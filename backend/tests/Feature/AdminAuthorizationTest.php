<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Mengunci gate admin, manajemen pengguna, dan pencatatan audit log.
 */
class AdminAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_user_is_blocked_from_every_admin_endpoint(): void
    {
        $user = $this->user('user@example.com');
        $application = $this->application($user);
        Sanctum::actingAs($user, ['api']);

        foreach ($this->adminGetEndpoints() as $endpoint) {
            $this->getJson($endpoint)->assertForbidden();
        }

        $this->postJson('/api/admin/users', [])->assertForbidden();
        $this->patchJson("/api/admin/applications/{$application->id}", ['status' => 'approved'])->assertForbidden();
        $this->patchJson("/api/admin/users/{$user->id}", ['role' => 'admin'])->assertForbidden();

        $this->assertSame('pending', $application->fresh()->status);
        $this->assertSame('user', $user->fresh()->role);
    }

    public function test_guest_is_rejected_with_401_from_admin_endpoints(): void
    {
        foreach ($this->adminGetEndpoints() as $endpoint) {
            $this->getJson($endpoint)->assertUnauthorized();
        }

        $this->postJson('/api/admin/users', [])->assertUnauthorized();
    }

    public function test_admin_can_reach_dashboard_endpoints(): void
    {
        $admin = $this->user('admin@example.com', 'admin');
        $this->application($this->user('user@example.com'));
        Sanctum::actingAs($admin, ['api']);

        $this->getJson('/api/admin/dashboard/stats')
            ->assertOk()
            ->assertJsonStructure(['data' => ['summary' => ['total', 'approved', 'processing', 'rejected', 'users'], 'monthly_apps', 'status_distribution', 'processing_time', 'bottlenecks']])
            ->assertJsonPath('data.summary.total', 1)
            ->assertJsonPath('data.summary.users', 2);
        $this->getJson('/api/admin/notifications')->assertOk()->assertJsonStructure(['data' => ['notifications']]);
        $this->getJson('/api/admin/applications')->assertOk()->assertJsonStructure(['data' => ['applications', 'pagination']]);
        $this->getJson('/api/admin/users')->assertOk()->assertJsonStructure(['data' => ['users']]);
        $this->getJson('/api/admin/audit-logs')->assertOk()->assertJsonStructure(['data' => ['audit_logs', 'pagination']]);
    }

    public function test_admin_created_user_can_be_marked_verified(): void
    {
        Sanctum::actingAs($this->user('admin@example.com', 'admin'), ['api']);

        $this->postJson('/api/admin/users', [
            'name' => 'Pegawai Baru',
            'email' => 'Pegawai.Baru@Example.com',
            'phone' => '081298765432',
            'password' => 'RahasiaKuat123',
            'role' => 'user',
            'email_verified' => true,
        ])->assertCreated()->assertJsonPath('data.user.email_verified', true);

        // Regresi: sebelum `email_verified_at` masuk $fillable, nilai ini selalu null
        // sehingga opsi "email terverifikasi" di form admin tidak pernah berefek.
        $created = User::where('email', 'pegawai.baru@example.com')->firstOrFail();
        $this->assertNotNull($created->email_verified_at);
        $this->assertSame('pegawai.baru@example.com', $created->email);
    }

    public function test_admin_created_user_can_be_left_unverified(): void
    {
        Sanctum::actingAs($this->user('admin@example.com', 'admin'), ['api']);

        $this->postJson('/api/admin/users', [
            'name' => 'Belum Verifikasi',
            'email' => 'belum@example.com',
            'password' => 'RahasiaKuat123',
            'role' => 'user',
            'email_verified' => false,
        ])->assertCreated()->assertJsonPath('data.user.email_verified', false);

        $this->assertNull(User::where('email', 'belum@example.com')->firstOrFail()->email_verified_at);
    }

    public function test_admin_created_user_password_is_hashed_and_never_returned(): void
    {
        Sanctum::actingAs($this->user('admin@example.com', 'admin'), ['api']);

        $response = $this->postJson('/api/admin/users', [
            'name' => 'Pegawai Aman',
            'email' => 'aman@example.com',
            'password' => 'RahasiaKuat123',
            'role' => 'admin',
        ])->assertCreated();

        $created = User::where('email', 'aman@example.com')->firstOrFail();
        $this->assertNotSame('RahasiaKuat123', $created->password);
        $this->assertTrue(Hash::check('RahasiaKuat123', $created->password));
        $response->assertDontSee('RahasiaKuat123');
        $this->assertArrayNotHasKey('password', $response->json('data.user'));
    }

    public function test_weak_password_and_duplicate_email_are_rejected(): void
    {
        Sanctum::actingAs($this->user('admin@example.com', 'admin'), ['api']);
        $this->user('sudah.ada@example.com');

        $this->postJson('/api/admin/users', [
            'name' => 'Password Lemah',
            'email' => 'lemah@example.com',
            'password' => 'abc',
            'role' => 'user',
        ])->assertStatus(422)->assertJsonValidationErrors('password');

        $this->postJson('/api/admin/users', [
            'name' => 'Email Duplikat',
            'email' => 'sudah.ada@example.com',
            'password' => 'RahasiaKuat123',
            'role' => 'user',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_admin_cannot_demote_or_deactivate_own_account(): void
    {
        $admin = $this->user('admin@example.com', 'admin');
        Sanctum::actingAs($admin, ['api']);

        $this->patchJson("/api/admin/users/{$admin->id}", ['role' => 'user'])->assertStatus(422);
        $this->patchJson("/api/admin/users/{$admin->id}", ['is_active' => false])->assertStatus(422);

        $admin->refresh();
        $this->assertSame('admin', $admin->role);
        $this->assertTrue($admin->is_active);
    }

    public function test_deactivating_a_user_revokes_their_tokens(): void
    {
        $admin = $this->user('admin@example.com', 'admin');
        $target = $this->user('target@example.com');
        $target->createToken('dsj-spa', ['api']);
        $this->assertDatabaseCount('personal_access_tokens', 1);

        Sanctum::actingAs($admin, ['api']);
        $this->patchJson("/api/admin/users/{$target->id}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.user.is_active', false);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_admin_update_changes_status_and_records_audit_log(): void
    {
        $admin = $this->user('admin@example.com', 'admin');
        $application = $this->application($this->user('user@example.com'));
        Sanctum::actingAs($admin, ['api']);

        $this->patchJson("/api/admin/applications/{$application->id}", [
            'status' => 'approved',
            'stage_sequence' => 2,
            'stage_status' => 'completed',
            'notes' => 'Dokumen lengkap dan sesuai.',
        ])->assertOk()->assertJsonPath('data.application.status', 'approved');

        $application->refresh();
        $this->assertSame('approved', $application->status);
        $this->assertNotNull($application->completed_at);

        $stage = $application->stages()->where('sequence', 2)->firstOrFail();
        $this->assertSame('completed', $stage->status);
        $this->assertSame('Dokumen lengkap dan sesuai.', $stage->notes);
        $this->assertSame($admin->id, $stage->updated_by);
        $this->assertNotNull($stage->completed_at);

        $log = AuditLog::where('action', 'application.updated')->firstOrFail();
        $this->assertSame($admin->id, $log->actor_id);
        $this->assertSame(Application::class, $log->subject_type);
        $this->assertSame($application->id, (int) $log->subject_id);
        $this->assertSame('pending', $log->before['status']);
        $this->assertSame('approved', $log->after['status']);
    }

    public function test_officer_must_be_an_active_admin(): void
    {
        $admin = $this->user('admin@example.com', 'admin');
        $regular = $this->user('user@example.com');
        $inactiveAdmin = $this->user('nonaktif@example.com', 'admin');
        $inactiveAdmin->update(['is_active' => false]);
        $application = $this->application($regular);

        Sanctum::actingAs($admin, ['api']);

        $this->patchJson("/api/admin/applications/{$application->id}", ['officer_id' => $regular->id])
            ->assertStatus(422)->assertJsonValidationErrors('officer_id');
        $this->patchJson("/api/admin/applications/{$application->id}", ['officer_id' => $inactiveAdmin->id])
            ->assertStatus(422)->assertJsonValidationErrors('officer_id');

        $this->patchJson("/api/admin/applications/{$application->id}", ['officer_id' => $admin->id])
            ->assertOk()->assertJsonPath('data.application.officer.id', $admin->id);
    }

    public function test_invalid_status_is_rejected(): void
    {
        $admin = $this->user('admin@example.com', 'admin');
        $application = $this->application($this->user('user@example.com'));
        Sanctum::actingAs($admin, ['api']);

        $this->patchJson("/api/admin/applications/{$application->id}", ['status' => 'dibatalkan'])
            ->assertStatus(422)->assertJsonValidationErrors('status');
        $this->patchJson("/api/admin/applications/{$application->id}", ['stage_sequence' => 9, 'stage_status' => 'completed'])
            ->assertStatus(422)->assertJsonValidationErrors('stage_sequence');

        $this->assertSame('pending', $application->fresh()->status);
        $this->assertDatabaseCount('audit_logs', 0);
    }

    public function test_user_management_actions_are_audit_logged(): void
    {
        $admin = $this->user('admin@example.com', 'admin');
        $target = $this->user('target@example.com');
        Sanctum::actingAs($admin, ['api']);

        $this->postJson('/api/admin/users', [
            'name' => 'Pegawai Baru',
            'email' => 'baru@example.com',
            'password' => 'RahasiaKuat123',
            'role' => 'user',
        ])->assertCreated();
        $this->patchJson("/api/admin/users/{$target->id}", ['role' => 'admin'])->assertOk();

        $created = AuditLog::where('action', 'user.created')->firstOrFail();
        $this->assertSame($admin->id, $created->actor_id);
        $this->assertNull($created->before);
        $this->assertSame('baru@example.com', $created->after['email']);
        // Audit log tidak boleh menyimpan password, bahkan dalam bentuk hash.
        $this->assertArrayNotHasKey('password', $created->after);

        $updated = AuditLog::where('action', 'user.updated')->firstOrFail();
        $this->assertSame('user', $updated->before['role']);
        $this->assertSame('admin', $updated->after['role']);
    }

    public function test_audit_log_listing_is_paginated_and_newest_first(): void
    {
        $admin = $this->user('admin@example.com', 'admin');
        $target = $this->user('target@example.com');
        Sanctum::actingAs($admin, ['api']);

        $this->patchJson("/api/admin/users/{$target->id}", ['role' => 'admin'])->assertOk();
        $this->patchJson("/api/admin/users/{$target->id}", ['is_active' => false])->assertOk();

        $response = $this->getJson('/api/admin/audit-logs?per_page=1')->assertOk();

        $this->assertCount(1, $response->json('data.audit_logs'));
        $this->assertSame(2, $response->json('data.pagination.total'));
        $this->assertSame(2, $response->json('data.pagination.last_page'));
    }

    /**
     * @return list<string>
     */
    private function adminGetEndpoints(): array
    {
        return [
            '/api/admin/dashboard/stats',
            '/api/admin/notifications',
            '/api/admin/applications',
            '/api/admin/users',
            '/api/admin/audit-logs',
        ];
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

    private function application(User $user, string $code = 'DSJ-2026-AA11'): Application
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

        foreach (['Permohonan Diterima', 'Verifikasi Dokumen', 'Review Teknis', 'Persetujuan Pejabat', 'SK Diterbitkan'] as $index => $name) {
            $application->stages()->create([
                'sequence' => $index + 1,
                'name' => $name,
                'status' => $index === 0 ? 'completed' : 'pending',
                'started_at' => $index === 0 ? now() : null,
                'completed_at' => $index === 0 ? now() : null,
            ]);
        }

        return $application;
    }
}
