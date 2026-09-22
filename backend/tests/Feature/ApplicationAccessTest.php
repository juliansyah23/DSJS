<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\ApplicationFile;
use App\Models\Draft;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Mengunci kontrak otorisasi per-resource: seorang user hanya boleh menyentuh
 * permohonan, berkas, dan draft miliknya sendiri.
 */
class ApplicationAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_application_index_only_returns_own_applications(): void
    {
        $owner = $this->user('owner@example.com');
        $other = $this->user('other@example.com');
        $this->application($owner, 'DSJ-2026-AA11');
        $this->application($other, 'DSJ-2026-BB22');

        Sanctum::actingAs($owner, ['api']);

        $response = $this->getJson('/api/applications')->assertOk();

        $this->assertCount(1, $response->json('data.applications'));
        $this->assertSame('DSJ-2026-AA11', $response->json('data.applications.0.code'));
    }

    public function test_owner_can_view_application_but_other_user_cannot(): void
    {
        $owner = $this->user('owner@example.com');
        $other = $this->user('other@example.com');
        $application = $this->application($owner, 'DSJ-2026-AA11');

        Sanctum::actingAs($owner, ['api']);
        $this->getJson("/api/applications/{$application->id}")
            ->assertOk()
            ->assertJsonPath('data.application.code', 'DSJ-2026-AA11')
            ->assertJsonStructure(['data' => ['application' => ['form_data', 'files']]]);

        Sanctum::actingAs($other, ['api']);
        $this->getJson("/api/applications/{$application->id}")->assertForbidden();
    }

    public function test_admin_can_view_any_application(): void
    {
        $owner = $this->user('owner@example.com');
        $admin = $this->user('admin@example.com', 'admin');
        $application = $this->application($owner, 'DSJ-2026-AA11');

        Sanctum::actingAs($admin, ['api']);
        $this->getJson("/api/applications/{$application->id}")->assertOk();
    }

    public function test_guest_cannot_view_application(): void
    {
        $application = $this->application($this->user('owner@example.com'), 'DSJ-2026-AA11');

        $this->getJson("/api/applications/{$application->id}")->assertUnauthorized();
    }

    public function test_file_download_is_restricted_to_owner_and_admin(): void
    {
        Storage::fake('application_files');
        $owner = $this->user('owner@example.com');
        $other = $this->user('other@example.com');
        $admin = $this->user('admin@example.com', 'admin');
        $application = $this->application($owner, 'DSJ-2026-AA11');
        $file = $this->file($application, $owner);

        Sanctum::actingAs($owner, ['api']);
        $this->get("/api/applications/{$application->id}/files/{$file->id}")
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff');

        Sanctum::actingAs($admin, ['api']);
        $this->get("/api/applications/{$application->id}/files/{$file->id}")->assertOk();

        Sanctum::actingAs($other, ['api']);
        $this->getJson("/api/applications/{$application->id}/files/{$file->id}")->assertForbidden();
    }

    public function test_guest_cannot_download_file(): void
    {
        Storage::fake('application_files');
        $owner = $this->user('owner@example.com');
        $application = $this->application($owner, 'DSJ-2026-AA11');
        $file = $this->file($application, $owner);

        $this->getJson("/api/applications/{$application->id}/files/{$file->id}")->assertUnauthorized();
    }

    public function test_file_cannot_be_downloaded_through_a_mismatched_application(): void
    {
        Storage::fake('application_files');
        $owner = $this->user('owner@example.com');
        $first = $this->application($owner, 'DSJ-2026-AA11');
        $second = $this->application($owner, 'DSJ-2026-CC33');
        $file = $this->file($first, $owner);

        Sanctum::actingAs($owner, ['api']);

        // Berkas milik permohonan lain: harus 404, bukan ikut terunduh.
        $this->getJson("/api/applications/{$second->id}/files/{$file->id}")->assertNotFound();
    }

    public function test_draft_index_only_returns_own_drafts(): void
    {
        $owner = $this->user('owner@example.com');
        $other = $this->user('other@example.com');
        $this->draft($owner);
        $this->draft($other);

        Sanctum::actingAs($owner, ['api']);

        $response = $this->getJson('/api/drafts')->assertOk();
        $this->assertCount(1, $response->json('data.drafts'));
    }

    public function test_other_user_cannot_read_update_or_delete_a_draft(): void
    {
        $owner = $this->user('owner@example.com');
        $other = $this->user('other@example.com');
        $draft = $this->draft($owner);

        Sanctum::actingAs($other, ['api']);

        $this->getJson("/api/drafts/{$draft->id}")->assertForbidden();
        $this->putJson("/api/drafts/{$draft->id}", [
            'current_step' => 3,
            'skip_company' => false,
            'form_data' => ['name' => 'Diubah Orang Lain'],
        ])->assertForbidden();
        $this->deleteJson("/api/drafts/{$draft->id}")->assertForbidden();

        $this->assertDatabaseHas('drafts', ['id' => $draft->id]);
        $this->assertSame('Punya Owner', $draft->fresh()->form_data['name']);
    }

    public function test_owner_can_update_and_delete_own_draft(): void
    {
        $owner = $this->user('owner@example.com');
        $draft = $this->draft($owner);

        Sanctum::actingAs($owner, ['api']);

        $this->putJson("/api/drafts/{$draft->id}", [
            'service_type' => 'sip',
            'current_step' => 4,
            'skip_company' => true,
            'form_data' => ['name' => 'Sudah Diperbarui'],
        ])->assertOk()->assertJsonPath('data.draft.current_step', 4);

        $this->deleteJson("/api/drafts/{$draft->id}")->assertOk();
        $this->assertDatabaseMissing('drafts', ['id' => $draft->id]);
    }

    private function user(string $email, string $role = 'user'): User
    {
        return User::create([
            'name' => 'Pengguna '.$email,
            'email' => $email,
            'phone' => '081234567890',
            'password' => 'Password123',
            'role' => $role,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
    }

    private function application(User $user, string $code): Application
    {
        $application = $user->applications()->create([
            'application_code' => $code,
            'service_type' => 'sip',
            'applicant_name' => $user->name,
            'company_name' => null,
            'status' => 'pending',
            'form_data' => ['ktp' => '3210987654321098', 'name' => $user->name],
            'submitted_at' => now(),
        ]);

        $application->stages()->create([
            'sequence' => 1,
            'name' => 'Permohonan Diterima',
            'status' => 'completed',
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        return $application;
    }

    private function file(Application $application, User $uploader): ApplicationFile
    {
        $path = $application->id.'/berkas.pdf';
        Storage::disk('application_files')->put($path, '%PDF-1.4 dummy');

        return $application->files()->create([
            'uploaded_by' => $uploader->id,
            'label' => 'KTP',
            'original_name' => 'ktp.pdf',
            'disk' => 'application_files',
            'path' => $path,
            'mime_type' => 'application/pdf',
            'size' => 14,
        ]);
    }

    private function draft(User $user): Draft
    {
        return $user->drafts()->create([
            'service_type' => 'sip',
            'current_step' => 2,
            'skip_company' => false,
            'form_data' => ['name' => 'Punya Owner'],
        ]);
    }
}
