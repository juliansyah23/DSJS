<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\AuditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminSecurityRegressionTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(array $attributes = []): User
    {
        return User::create(array_merge([
            'name' => 'Test User',
            'email' => uniqid('test-', true).'@example.com',
            'password' => 'TestPassword123!',
            'role' => 'user',
            'is_active' => true,
            'email_verified_at' => now(),
        ], $attributes));
    }

    public function test_inactive_admin_cannot_access_admin_endpoints(): void
    {
        Sanctum::actingAs($this->createUser(['role' => 'admin', 'is_active' => false]));

        $this->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_admin_can_update_user_profile_and_password_without_leaking_password(): void
    {
        Sanctum::actingAs($this->createUser(['role' => 'admin']));
        $user = $this->createUser();
        $user->createToken('existing-session');

        $this->patchJson("/api/admin/users/{$user->id}", [
            'name' => 'Updated Name',
            'phone' => '08123456789',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertOk()->assertJsonPath('data.user.name', 'Updated Name')
            ->assertJsonMissingPath('data.user.password');

        $this->assertSame('08123456789', $user->fresh()->phone);
        $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_user_update_rolls_back_when_audit_fails(): void
    {
        Sanctum::actingAs($this->createUser(['role' => 'admin']));
        $user = $this->createUser(['name' => 'Original Name']);
        $this->mock(AuditService::class, function ($mock) {
            $mock->shouldReceive('record')->once()->andThrow(new \RuntimeException('Audit unavailable'));
        });

        $this->patchJson("/api/admin/users/{$user->id}", ['name' => 'Changed Name'])
            ->assertStatus(500);

        $this->assertSame('Original Name', $user->fresh()->name);
    }
}