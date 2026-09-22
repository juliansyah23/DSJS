<?php

namespace Tests\Feature;

use App\Models\Otp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_password_otp_cannot_be_exchanged_for_login_token(): void
    {
        $user = $this->user();
        $otp = Otp::create([
            'email' => $user->email,
            'code_hash' => Hash::make('123456'),
            'purpose' => 'reset_password',
            'expires_at' => now()->addMinutes(5),
        ]);

        $this->postJson('/api/auth/verify-otp', [
            'email' => $user->email,
            'code' => '123456',
            'purpose' => 'reset_password',
        ])->assertStatus(422)->assertJsonValidationErrors('purpose');

        $this->assertNull($otp->fresh()->consumed_at);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_registration_otp_verifies_email_and_issues_limited_token(): void
    {
        $user = $this->user(verified: false);
        Otp::create([
            'email' => $user->email,
            'code_hash' => Hash::make('654321'),
            'purpose' => 'register',
            'expires_at' => now()->addMinutes(5),
        ]);

        $response = $this->postJson('/api/auth/verify-otp', [
            'email' => $user->email,
            'code' => '654321',
            'purpose' => 'register',
        ])->assertOk()->assertJsonPath('data.user.email', $user->email);

        $this->assertNotNull($user->fresh()->email_verified_at);
        $token = PersonalAccessToken::findToken($response->json('data.token'));
        $this->assertSame(['api'], $token->abilities);
    }

    public function test_inactive_account_cannot_login(): void
    {
        $user = $this->user(active: false);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'Password123',
        ])->assertForbidden();
    }

    public function test_resend_response_does_not_enumerate_accounts_or_cooldown(): void
    {
        $user = $this->user();
        Otp::create([
            'email' => $user->email,
            'code_hash' => Hash::make('123456'),
            'purpose' => 'reset_password',
            'expires_at' => now()->addMinutes(5),
        ]);

        $known = $this->postJson('/api/auth/resend-otp', [
            'email' => $user->email,
            'purpose' => 'reset_password',
        ]);
        $unknown = $this->postJson('/api/auth/resend-otp', [
            'email' => 'unknown@example.com',
            'purpose' => 'reset_password',
        ]);

        $known->assertOk();
        $unknown->assertOk();
        $this->assertSame($known->json('message'), $unknown->json('message'));
    }

    private function user(bool $verified = true, bool $active = true): User
    {
        return User::create([
            'name' => 'Pengguna Test',
            'email' => 'user@example.com',
            'phone' => '081234567890',
            'password' => 'Password123',
            'role' => 'user',
            'is_active' => $active,
            'email_verified_at' => $verified ? now() : null,
        ]);
    }
}