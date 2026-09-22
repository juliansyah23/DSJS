<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Mengunci alur submit permohonan: 9 berkas PDF wajib, disimpan di disk privat
 * `application_files`, dan draft yang dibersihkan hanya milik pemohon sendiri.
 */
class ApplicationSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_submit_stores_nine_pdf_files_on_the_private_disk(): void
    {
        Storage::fake('application_files');
        $user = $this->user();
        Sanctum::actingAs($user, ['api']);

        $response = $this->post('/api/applications', $this->payload(), ['Accept' => 'application/json'])
            ->assertCreated();

        $applicationId = $response->json('data.application.id');
        $this->assertDatabaseCount('application_files', 9);
        $this->assertCount(9, $response->json('data.application.files'));

        // Semua berkas benar-benar tertulis ke disk privat, di folder per permohonan.
        $stored = \App\Models\ApplicationFile::all();
        foreach ($stored as $file) {
            $this->assertSame('application_files', $file->disk);
            $this->assertStringStartsWith($applicationId.'/', $file->path);
            $this->assertStringEndsWith('.pdf', $file->path);
            $this->assertSame('application/pdf', $file->mime_type);
            Storage::disk('application_files')->assertExists($file->path);
        }

        // Nama asli dipertahankan untuk keperluan unduh, tapi path di disk diacak (UUID)
        // sehingga tidak bisa ditebak dari luar.
        $this->assertSame('berkas-1.pdf', $stored->first()->original_name);
        $this->assertStringNotContainsString('berkas-1', $stored->first()->path);

        // Metadata internal tidak boleh ikut keluar di response.
        $firstPayloadFile = $response->json('data.application.files.0');
        $this->assertArrayNotHasKey('path', $firstPayloadFile);
        $this->assertArrayNotHasKey('disk', $firstPayloadFile);
    }

    public function test_submit_creates_five_stages_and_a_trackable_code(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $response = $this->post('/api/applications', $this->payload(), ['Accept' => 'application/json'])
            ->assertCreated();

        $stages = $response->json('data.application.stages');
        $this->assertCount(5, $stages);
        $this->assertSame('completed', $stages[0]['status']);
        $this->assertSame('in_progress', $stages[1]['status']);
        $this->assertSame('pending', $stages[4]['status']);

        // Kode yang dihasilkan harus lolos pola yang diterima endpoint track publik.
        $code = $response->json('data.application.code');
        $this->assertMatchesRegularExpression('/^DSJ-\d{4}-[A-Z0-9]{4,12}$/', $code);
        $this->getJson('/api/track/'.$code)->assertOk()->assertJsonPath('data.application.code', $code);
    }

    public function test_guest_cannot_submit_application(): void
    {
        Storage::fake('application_files');

        $this->post('/api/applications', $this->payload(), ['Accept' => 'application/json'])
            ->assertUnauthorized();

        $this->assertDatabaseCount('applications', 0);
    }

    public function test_submit_rejects_wrong_number_of_files(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $this->post('/api/applications', $this->payload(fileCount: 8), ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['files', 'file_labels']);

        $this->assertDatabaseCount('applications', 0);
        $this->assertDatabaseCount('application_files', 0);
    }

    public function test_submit_rejects_non_pdf_upload(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $payload = $this->payload();
        // Berkas ke-3 diganti file berbahaya yang menyamar dengan ekstensi pdf.
        $payload['files'][2] = UploadedFile::fake()->create('virus.pdf', 50, 'application/x-msdownload');

        $this->post('/api/applications', $payload, ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('files.2');

        $this->assertDatabaseCount('applications', 0);
        Storage::disk('application_files')->assertDirectoryEmpty('');
    }

    public function test_submit_rejects_oversized_file(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $payload = $this->payload();
        $max = (int) config('uploads.max_size_kb', 5120);
        $payload['files'][0] = UploadedFile::fake()->create('besar.pdf', $max + 64, 'application/pdf');

        $this->post('/api/applications', $payload, ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('files.0');
    }

    public function test_submit_requires_company_fields_when_not_skipped(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $this->post('/api/applications', $this->payload(['skip_company' => '0']), ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['form_data.companyName', 'form_data.companyEmail']);
    }

    public function test_submit_rejects_invalid_ktp(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $form = $this->formData();
        $form['ktp'] = '123';

        $this->post('/api/applications', $this->payload(['form_data' => json_encode($form)]), ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('form_data.ktp');
    }

    public function test_submit_removes_own_draft_but_never_another_users_draft(): void
    {
        Storage::fake('application_files');
        $owner = $this->user();
        $other = $this->user('other@example.com');

        $ownDraft = $owner->drafts()->create([
            'service_type' => 'sip',
            'current_step' => 5,
            'skip_company' => true,
            'form_data' => ['name' => 'Draft Pemohon'],
        ]);
        $foreignDraft = $other->drafts()->create([
            'service_type' => 'sip',
            'current_step' => 2,
            'skip_company' => true,
            'form_data' => ['name' => 'Draft Orang Lain'],
        ]);

        Sanctum::actingAs($owner, ['api']);

        // Draft sendiri: ikut terhapus setelah submit berhasil.
        $this->post('/api/applications', $this->payload(['draft_id' => (string) $ownDraft->id]), ['Accept' => 'application/json'])
            ->assertCreated();
        $this->assertDatabaseMissing('drafts', ['id' => $ownDraft->id]);

        // Draft milik user lain: submit tetap sukses, tapi draft itu wajib utuh.
        $this->post('/api/applications', $this->payload(['draft_id' => (string) $foreignDraft->id]), ['Accept' => 'application/json'])
            ->assertCreated();
        $this->assertDatabaseHas('drafts', ['id' => $foreignDraft->id, 'user_id' => $other->id]);
    }

    private function user(string $email = 'pemohon@example.com'): User
    {
        return User::create([
            'name' => 'Budi Santoso',
            'email' => $email,
            'phone' => '081234567890',
            'password' => 'Password123',
            'role' => 'user',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = [], int $fileCount = 9): array
    {
        $files = [];
        $labels = [];
        for ($i = 1; $i <= $fileCount; $i++) {
            $files[] = UploadedFile::fake()->create("berkas-{$i}.pdf", 120, 'application/pdf');
            $labels[] = "Dokumen Persyaratan {$i}";
        }

        return array_merge([
            'service_type' => 'sip',
            'skip_company' => '1',
            'form_data' => json_encode($this->formData()),
            'file_labels' => json_encode($labels),
            'files' => $files,
        ], $overrides);
    }

    /**
     * @return array<string, mixed>
     */
    private function formData(): array
    {
        return [
            'ktp' => '3210987654321098',
            'name' => 'Budi Santoso',
            'phone' => '081234567890',
            'province' => 'Jawa Barat',
            'city' => 'Bandung',
            'district' => 'Coblong',
            'village' => 'Dago',
            'address' => 'Jl. Ir. H. Juanda No. 100',
            'permitCity' => 'Bandung',
            'permitDistrict' => 'Coblong',
            'permitVillage' => 'Dago',
            'permitAddress' => 'Jl. Ir. H. Juanda No. 102',
            'decName' => 'Budi Santoso',
            'decAddress' => 'Jl. Ir. H. Juanda No. 100',
            'education' => 'S1 Pendidikan',
            'position' => 'Direktur',
            'decPhone' => '081234567890',
            'institutionLembaga' => 'Yayasan Cerdas Bangsa',
            'instName' => 'LKP Cerdas Bangsa',
            'instAddress' => 'Jl. Dago No. 5',
            'admin' => 'Siti Aminah',
            'building' => 'Gedung milik sendiri, 3 lantai',
            'equipment' => '20 unit komputer, 2 proyektor',
            'curriculum' => 'Kurikulum berbasis kompetensi nasional',
            'students' => 25,
            'fees' => 'Rp 500.000 per bulan',
        ];
    }
}
