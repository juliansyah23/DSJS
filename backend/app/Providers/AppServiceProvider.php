<?php

namespace App\Providers;

use App\Models\Application;
use App\Models\Draft;
use App\Policies\ApplicationPolicy;
use App\Policies\DraftPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Application::class, ApplicationPolicy::class);
        Gate::policy(Draft::class, DraftPolicy::class);

        // Limiter umum untuk seluruh /api (default Laravel: throttle:api)
        RateLimiter::for('api', function ($request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Limiter ketat khusus login — cegah brute force password.
        // Dikunci per kombinasi email+IP agar 1 IP tidak bisa memblokir akun orang lain (no account lockout DoS).
        RateLimiter::for('login', function ($request) {
            $key = strtolower((string) $request->input('email')).'|'.$request->ip();

            return Limit::perMinute(5)->by($key)->response(function () {
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.',
                ], 429);
            });
        });

        // Limiter untuk permintaan/verifikasi OTP — cegah spam OTP & brute-force kode 6 digit.
        RateLimiter::for('otp', function ($request) {
            $key = strtolower((string) $request->input('email')).'|'.$request->ip();

            return Limit::perMinute(5)->by($key)->response(function () {
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak percobaan. Silakan coba lagi sebentar lagi.',
                ], 429);
            });
        });

        // Limiter untuk registrasi — cegah pembuatan akun massal otomatis.
        RateLimiter::for('register', function ($request) {
            return Limit::perMinute(3)->by($request->ip());
        });

        RateLimiter::for('track', function ($request) {
            return Limit::perMinute(20)->by($request->ip());
        });

        RateLimiter::for('upload', function ($request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });
    }
}
