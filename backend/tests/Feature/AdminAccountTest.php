<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAccountTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::create(['name' => 'Administrator', 'email' => 'account@example.com',
            'password' => 'Original123!', 'role' => 'admin', 'is_active' => true]);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_profile_is_saved_without_changing_role(): void
    {
        $user = $this->admin();
        $this->patchJson('/api/admin/account', ['name' => 'Updated Admin', 'phone' => '0812345', 'role' => 'user'])
            ->assertOk()->assertJsonPath('data.user.name', 'Updated Admin');
        $this->assertSame('admin', $user->fresh()->role);
        $this->assertSame('0812345', $user->fresh()->phone);
    }

    public function test_password_change_requires_correct_current_password(): void
    {
        $user = $this->admin();
        $this->patchJson('/api/admin/account', ['current_password' => 'wrong', 'password' => 'Updated123!', 'password_confirmation' => 'Updated123!'])
            ->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->assertTrue(Hash::check('Original123!', $user->fresh()->password));
    }

    public function test_password_change_revokes_tokens(): void
    {
        $user = $this->admin();
        $user->createToken('session');
        $this->patchJson('/api/admin/account', ['current_password' => 'Original123!', 'password' => 'Updated123!', 'password_confirmation' => 'Updated123!'])
            ->assertOk()->assertJsonPath('data.requires_login', true);
        $this->assertTrue(Hash::check('Updated123!', $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
    }
}