<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Endpoint /api/track/{code} bersifat publik (tanpa auth), jadi payload-nya
 * wajib bersih dari data pribadi pemohon. Test di sini mengunci kontrak itu.
 */
class PublicTrackTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_track_never_exposes_personal_data(): void
    {
        $application = $this->application();

        $response = $this->getJson('/api/track/DSJ-2026-AB12')->assertOk();
        $payload = $response->json('data.application');

        // Yang boleh tampil: kode, jenis layanan, status, dan riwayat tahapan.
        $this->assertSame($application->application_code, $payload['code']);
        $this->assertSame('sip', $payload['service_type']);
        $this->assertSame('Surat Ijin Praktek (SIP)', $payload['service_label']);
        $this->assertCount(2, $payload['stages']);
        $this->assertSame('Verifikasi Dokumen', $payload['stages'][1]['name']);

        // Yang tidak boleh ikut bocor ke publik.
        $this->assertArrayNotHasKey('applicant_name', $payload);
        $this->assertArrayNotHasKey('company_name', $payload);
        $this->assertArrayNotHasKey('officer', $payload);
        $this->assertArrayNotHasKey('form_data', $payload);
        $this->assertArrayNotHasKey('files', $payload);

        // Jaring pengaman tambahan: NIK/nama tidak muncul di mana pun dalam body.
        $response->assertDontSee('3210987654321098');
        $response->assertDontSee('Pemohon Rahasia');
        $response->assertDontSee('PT Rahasia Sejahtera');
    }

    public function test_track_rejects_malformed_code_without_touching_database(): void
    {
        $this->application();

        foreach (['bukan-kode', '1 OR 1=1', 'DSJ-20-A', '../../etc/passwd'] as $code) {
            $this->getJson('/api/track/'.urlencode($code))->assertNotFound();
        }
    }

    public function test_track_returns_not_found_for_unknown_but_well_formed_code(): void
    {
        $this->application();

        $this->getJson('/api/track/DSJ-2026-ZZ99')->assertNotFound();
    }

    public function test_track_is_case_insensitive_for_existing_code(): void
    {
        $this->application();

        $this->getJson('/api/track/dsj-2026-ab12')
            ->assertOk()
            ->assertJsonPath('data.application.code', 'DSJ-2026-AB12');
    }

    private function application(): Application
    {
        $user = User::create([
            'name' => 'Pemohon Rahasia',
            'email' => 'pemohon@example.com',
            'phone' => '081234567890',
            'password' => 'Password123',
            'role' => 'user',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $application = $user->applications()->create([
            'application_code' => 'DSJ-2026-AB12',
            'service_type' => 'sip',
            'applicant_name' => 'Pemohon Rahasia',
            'company_name' => 'PT Rahasia Sejahtera',
            'status' => 'review',
            'form_data' => ['ktp' => '3210987654321098', 'name' => 'Pemohon Rahasia'],
            'submitted_at' => now()->subDays(3),
        ]);

        $application->stages()->create([
            'sequence' => 1,
            'name' => 'Permohonan Diterima',
            'status' => 'completed',
            'started_at' => now()->subDays(3),
            'completed_at' => now()->subDays(3),
        ]);
        $application->stages()->create([
            'sequence' => 2,
            'name' => 'Verifikasi Dokumen',
            'status' => 'in_progress',
            'started_at' => now()->subDays(2),
        ]);

        return $application;
    }
}
