<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApplicationSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_submit_application(): void
    {
        $this->postJson('/api/applications', $this->payload())
            ->assertStatus(401);
    }

    public function test_submit_creates_application_with_stages_and_stores_files(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $response = $this->post('/api/applications', $this->payload(), ['Accept' => 'application/json'])
            ->assertCreated();

        $this->assertDatabaseCount('applications', 1);
        $this->assertDatabaseCount('application_stages', 5);
        $this->assertDatabaseCount('application_files', 9);

        $application = $response->json('data.application');
        $this->assertSame('sip', $application['service_type']);
        $this->assertSame('pending', $application['status']);
        $this->assertCount(5, $application['stages']);
        $this->assertSame('completed', $application['stages'][0]['status']);
        $this->assertSame('in_progress', $application['stages'][1]['status']);

        $storedFile = \App\Models\ApplicationFile::first();
        Storage::disk('application_files')->assertExists($storedFile->path);
    }

    public function test_submit_sip_accepts_frontend_nama_pemohon_field(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $formData = $this->formData();
        unset($formData['decName']);
        $formData['namaPemohon'] = 'Budi Santoso';

        $this->post('/api/applications', $this->payload([
            'form_data' => json_encode($formData, JSON_THROW_ON_ERROR),
        ]), ['Accept' => 'application/json'])
            ->assertCreated();
    }

    public function test_submit_rejects_wrong_file_count_and_missing_labels(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $this->post('/api/applications', $this->payload([], 8), ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['files']);

        $payload = $this->payload();
        $payload['file_labels'] = json_encode([]);

        $this->post('/api/applications', $payload, ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file_labels']);
    }

    public function test_submit_rejects_mismatched_file_label_indices(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $payload = $this->payload();
        $labels = json_decode($payload['file_labels'], true, 512, JSON_THROW_ON_ERROR);
        $shiftedLabels = [];
        foreach ($labels as $index => $label) {
            $shiftedLabels[$index + 1] = $label;
        }
        $payload['file_labels'] = json_encode($shiftedLabels, JSON_THROW_ON_ERROR);

        $this->post('/api/applications', $payload, ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file_labels');

        $this->assertDatabaseCount('applications', 0);
    }

    public function test_submit_rejects_invalid_pdf_mime_and_oversize(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $payload = $this->payload();
        $payload['files'][0] = UploadedFile::fake()->create('malware.exe', 100, 'application/x-msdownload');

        $this->post('/api/applications', $payload, ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('files.0');

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

        $payload = $this->payload();
        $payload['skip_company'] = '0';

        $this->post('/api/applications', $payload, ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['form_data.companyName', 'form_data.companyNpwp']);
    }

    public function test_submit_validates_ktp_digits(): void
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
        $owner = $this->user('owner@example.com');
        $other = $this->user('other@example.com');
        $ownDraft = $owner->drafts()->create([
            'service_type' => 'sip',
            'current_step' => 3,
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

        $this->post('/api/applications', $this->payload(['draft_id' => (string) $ownDraft->id]), ['Accept' => 'application/json'])
            ->assertCreated();
        $this->assertDatabaseMissing('drafts', ['id' => $ownDraft->id]);

        $this->post('/api/applications', $this->payload(['draft_id' => (string) $foreignDraft->id]), ['Accept' => 'application/json'])
            ->assertCreated();
        $this->assertDatabaseHas('drafts', ['id' => $foreignDraft->id, 'user_id' => $other->id]);
    }

    public function test_submit_simbg_with_valid_data(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $response = $this->post('/api/applications', $this->simbgPayload(), ['Accept' => 'application/json'])
            ->assertCreated();

        $this->assertDatabaseCount('applications', 1);
        $this->assertDatabaseCount('application_files', 1);

        $application = $response->json('data.application');
        $this->assertSame('simbg', $application['service_type']);
        $this->assertCount(5, $application['stages']);
    }

    public function test_submit_simbg_with_valid_non_prototype_data(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $formData = $this->simbgFormData([
            'gunakanDesainPrototipe' => 'Tidak',
            'penggunaanBangunanLebihDari5Tahun' => 'Tidak, Kurang dari 5 tahun',
            'fungsiBangunan' => 'Fungsi Hunian, Fungsi Usaha',
            'kategoriBangunan' => 'Rumah Tinggal Tunggal',
            'memilikiBasemen' => 'Tidak Memiliki',
            'namaBangunan' => 'Rumah Tinggal Budi',
            'luasTotalBangunanPerUnit' => 72,
            'tinggiBangunan' => 4.5,
            'jumlahLantai' => '1',
            'jumlahUnit' => 1,
            'estimasiJumlahPenghuni' => 4,
        ]);

        $this->post('/api/applications', [
            'service_type' => 'simbg',
            'skip_company' => '1',
            'form_data' => json_encode($formData),
            'file_labels' => json_encode(['Gambar Peta Lokasi Bangunan']),
            'files' => [UploadedFile::fake()->create('peta.jpg', 500, 'image/jpeg')],
        ], ['Accept' => 'application/json'])
            ->assertCreated();
    }

    public function test_submit_simbg_rejects_missing_conditional_fields(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $prototypeData = $this->simbgFormData();
        unset($prototypeData['jumlahUnitDibangun']);

        $this->post('/api/applications', $this->simbgPayload([
            'form_data' => json_encode($prototypeData),
        ]), ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('form_data.jumlahUnitDibangun');

        $nonPrototypeData = $this->simbgFormData([
            'gunakanDesainPrototipe' => 'Tidak',
            'penggunaanBangunanLebihDari5Tahun' => 'Tidak, Kurang dari 5 tahun',
            'fungsiBangunan' => 'Fungsi Hunian',
            'kategoriBangunan' => 'Rumah Tinggal Tunggal',
            'memilikiBasemen' => 'Tidak Memiliki',
            'namaBangunan' => 'Rumah Tinggal Budi',
            'luasTotalBangunanPerUnit' => 72,
            'tinggiBangunan' => 4.5,
            'jumlahLantai' => '1',
            'jumlahUnit' => 1,
            'estimasiJumlahPenghuni' => 4,
        ]);
        unset($nonPrototypeData['fungsiBangunan']);

        $this->post('/api/applications', $this->simbgPayload([
            'form_data' => json_encode($nonPrototypeData),
        ]), ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('form_data.fungsiBangunan');
    }

    public function test_submit_simbg_rejects_invalid_prototype_answer(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $formData = $this->simbgFormData();
        $formData['gunakanDesainPrototipe'] = 'Mungkin';

        $this->post('/api/applications', [
            'service_type' => 'simbg',
            'skip_company' => '1',
            'form_data' => json_encode($formData),
            'file_labels' => json_encode(['Gambar Peta Lokasi Bangunan']),
            'files' => [UploadedFile::fake()->create('peta.jpg', 500, 'image/jpeg')],
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable();
    }

    public function test_submit_simbg_rejects_invalid_coordinates(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $formData = $this->simbgFormData();
        $formData['latitudeBangunan'] = 'bukan-angka';
        $formData['longitudeBangunan'] = '12345';

        $this->post('/api/applications', [
            'service_type' => 'simbg',
            'skip_company' => '1',
            'form_data' => json_encode($formData),
            'file_labels' => json_encode(['Gambar Peta Lokasi Bangunan']),
            'files' => [UploadedFile::fake()->create('peta.jpg', 500, 'image/jpeg')],
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['form_data.latitudeBangunan', 'form_data.longitudeBangunan']);
    }

    public function test_submit_sip_does_not_require_simbg_only_land_ownership_count(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $formData = $this->formData();
        $formData['jumlahBuktiKepemilikanTanah'] = 0;

        $files = [];
        $labels = [];
        for ($i = 1; $i <= 9; $i++) {
            $files[] = UploadedFile::fake()->create("berkas-{$i}.pdf", 120, 'application/pdf');
            $labels[] = "Dokumen Persyaratan {$i}";
        }

        $this->post('/api/applications', [
            'service_type' => 'sip',
            'skip_company' => '1',
            'form_data' => json_encode($formData),
            'file_labels' => json_encode($labels),
            'files' => $files,
        ], ['Accept' => 'application/json'])
            ->assertCreated();
    }

    public function test_submit_oss_rejects_any_files(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $this->post('/api/applications', [
            'service_type' => 'oss',
            'skip_company' => '1',
            'form_data' => json_encode($this->ossFormData()),
            'file_labels' => json_encode(['dokumen.pdf']),
            'files' => [UploadedFile::fake()->create('dokumen.pdf', 500, 'application/pdf')],
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['files']);
    }

    public function test_submit_oss_rejects_file_labels_without_files(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $this->post('/api/applications', [
            'service_type' => 'oss',
            'skip_company' => '1',
            'form_data' => json_encode($this->ossFormData()),
            'file_labels' => json_encode(['dokumen.pdf']),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file_labels');

        $this->assertDatabaseCount('applications', 0);
    }

    public function test_submit_oss_rejects_invalid_kbli(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $formData = $this->ossFormData();
        $formData['kbli'] = '1234';

        $this->post('/api/applications', [
            'service_type' => 'oss',
            'skip_company' => '1',
            'form_data' => json_encode($formData),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['form_data.kbli']);

        $formData['kbli'] = 'ABCDE';

        $this->post('/api/applications', [
            'service_type' => 'oss',
            'skip_company' => '1',
            'form_data' => json_encode($formData),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['form_data.kbli']);
    }

    public function test_submit_oss_with_valid_data(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $response = $this->post('/api/applications', $this->ossPayload(), ['Accept' => 'application/json'])
            ->assertCreated();

        $this->assertDatabaseCount('applications', 1);
        $this->assertDatabaseCount('application_files', 0);

        $application = $response->json('data.application');
        $this->assertSame('oss', $application['service_type']);
        $this->assertCount(5, $application['stages']);
    }

    public function test_submit_oss_accepts_frontend_usaha_mikro_label(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $formData = $this->ossFormData();
        $formData['skalaUsaha'] = 'Usaha Mikro';

        $this->post('/api/applications', $this->ossPayload([
            'form_data' => json_encode($formData),
        ]), ['Accept' => 'application/json'])
            ->assertCreated();
    }

    public function test_submit_oss_rejects_missing_required_fields(): void
    {
        Storage::fake('application_files');
        Sanctum::actingAs($this->user(), ['api']);

        $formData = $this->ossFormData();
        unset($formData['namaUsaha']);

        $this->post('/api/applications', [
            'service_type' => 'oss',
            'skip_company' => '1',
            'form_data' => json_encode($formData),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable();
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
            'provinsi' => 'Jawa Barat',
            'kota' => 'Bandung',
            'kecamatan' => 'Coblong',
            'kelurahan' => 'Dago',
            'latitudeBangunan' => '-6.8915',
            'longitudeBangunan' => '107.6107',
            'kepemilikanBangunanGedung' => 'Milik Sendiri',
            'jumlahBuktiKepemilikanTanah' => 1,
            'jumlahPenghuni' => 5,
            'jenisBangunan' => 'Gedung Pendidikan',
            'jumlahLantai' => '3',
            'jumlahBasement' => '0',
            'statusPekerjaan' => 'Baru',
            'namaPemilik' => 'Budi Santoso',
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

    private function simbgPayload(array $overrides = []): array
    {
        return array_merge([
            'service_type' => 'simbg',
            'skip_company' => '1',
            'form_data' => json_encode($this->simbgFormData()),
            'file_labels' => json_encode(['Gambar Peta Lokasi Bangunan']),
            'files' => [UploadedFile::fake()->create('peta.jpg', 500, 'image/jpeg')],
        ], $overrides);
    }

    private function simbgFormData(array $overrides = []): array
    {
        return array_merge([
            'ktp' => '3175012345678901',
            'name' => 'Budi Santoso',
            'phone' => '081234567890',
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Selatan',
            'district' => 'Kebayoran Baru',
            'village' => 'Senayan',
            'address' => 'Jl. Sudirman No. 123',
            'permitCity' => 'Jakarta Selatan',
            'permitDistrict' => 'Kebayoran Baru',
            'permitVillage' => 'Senayan',
            'permitAddress' => 'Jl. Asia Afrika No. 8',
            'nomorDokumenIzinPemanfaatanRuang' => 'IMB-RUANG-001',
            'gsb' => 3,
            'jumlahBuktiKepemilikanTanah' => 0,
            'gunakanDesainPrototipe' => 'Ya',
            'kepemilikanBangunanGedung' => 'Perorangan',
            'namaBangunan' => 'Rumah Tinggal Budi',
            'alamatBangunan' => 'Jl. Asia Afrika No. 8',
            'kotaBangunan' => 'Jakarta Selatan',
            'kecamatanBangunan' => 'Kebayoran Baru',
            'kelurahanBangunan' => 'Senayan',
            'latitudeBangunan' => '-6.2297',
            'longitudeBangunan' => '106.8075',
            'jumlahUnitDibangun' => 1,
            'jumlahPenghuni' => 4,
            'desainPrototipe' => 'Rumah Tinggal Sederhana Tipe 36 (PP No. 16 Tahun 2021)',
            'kdb' => 0.6,
            'klb' => 1.2,
            'kdh' => 0.3,
        ], $overrides);
    }

    private function ossPayload(array $overrides = []): array
    {
        return array_merge([
            'service_type' => 'oss',
            'skip_company' => '1',
            'form_data' => json_encode($this->ossFormData()),
            'file_labels' => json_encode([]),
            'files' => [],
        ], $overrides);
    }

    private function ossFormData(): array
    {
        return [
            'ktp' => '3175012345678901',
            'name' => 'Budi Santoso',
            'phone' => '081234567890',
            'province' => 'DKI Jakarta',
            'city' => 'Jakarta Selatan',
            'district' => 'Kebayoran Baru',
            'village' => 'Senayan',
            'address' => 'Jl. Sudirman No. 123',
            'permitCity' => 'Jakarta Selatan',
            'permitDistrict' => 'Kebayoran Baru',
            'permitVillage' => 'Senayan',
            'permitAddress' => 'Jl. Asia Afrika No. 8',
            'namaUsaha' => 'Toko Kelontong Budi',
            'skalaUsaha' => 'Mikro',
            'tingkatRisiko' => 'Rendah',
            'kbli' => '47111',
            'deskripsiKegiatanUsaha' => 'Perdagangan eceran berbagai macam barang',
            'alamatUsaha' => 'Jl. Asia Afrika No. 8',
        ];
    }
}
