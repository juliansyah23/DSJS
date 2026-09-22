<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResendOtpRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Models\Otp;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(private readonly OtpService $otp) {}

    /**
     * POST /api/auth/register
     * Membuat akun baru (belum aktif) lalu mengirim OTP untuk verifikasi email.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->string('name'),
                'email' => strtolower($request->string('email')),
                'phone' => $request->string('phone'),
                'password' => $request->string('password'), // otomatis di-hash oleh cast 'hashed' pada Model
                'role' => 'user',
            ]);

            $this->otp->generate($user->email, 'register', $request->ip());

            return $user;
        });

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil. Kode OTP telah dikirim ke email Anda.',
            'data' => ['email' => $user->email, 'name' => $user->name],
        ], 201);
    }

    /**
     * POST /api/auth/verify-otp
     * Memverifikasi OTP registrasi, mengaktifkan akun, dan langsung login (issue token).
     */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $email = strtolower($request->string('email'));

        if (! $this->otp->verify($email, $request->string('purpose'), $request->string('code'))) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP salah atau sudah kedaluwarsa.',
            ], 422);
        }

        $user = User::where('email', $email)->firstOrFail();

        if (! $user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        $token = $user->createToken('dsj-spa', ['api'])->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Verifikasi berhasil.',
            'data' => [
                'user' => $this->userPayload($user),
                'token' => $token,
            ],
        ]);
    }

    /**
     * POST /api/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $email = strtolower($request->string('email'));
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun dinonaktifkan. Hubungi administrator.',
            ], 403);
        }

        if (! $user->email_verified_at) {
            $this->otp->generate($user->email, 'register', $request->ip());

            return response()->json([
                'success' => false,
                'message' => 'Akun belum diverifikasi. Kode OTP baru telah dikirim ke email Anda.',
                'data' => ['requires_verification' => true, 'email' => $user->email],
            ], 403);
        }

        $token = $user->createToken('dsj-spa', ['api'])->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'user' => $this->userPayload($user),
                'token' => $token,
            ],
        ]);
    }

    /**
     * POST /api/auth/logout
     * Mencabut hanya token yang sedang dipakai request ini (bukan semua sesi device lain).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil keluar.',
        ]);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['user' => $this->userPayload($request->user())],
        ]);
    }

    /**
     * POST /api/auth/forgot-password
     * Selalu balas pesan yang sama baik email terdaftar maupun tidak, untuk mencegah user enumeration.
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $email = strtolower($request->string('email'));
        $user = User::where('email', $email)->first();

        if ($user) {
            $this->otp->generate($email, 'reset_password', $request->ip());
        }

        return response()->json([
            'success' => true,
            'message' => 'Jika email terdaftar, kode OTP reset password telah dikirim.',
        ]);
    }

    /**
     * POST /api/auth/reset-password
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $email = strtolower($request->string('email'));

        if (! $this->otp->verify($email, 'reset_password', $request->string('code'))) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP salah atau sudah kedaluwarsa.',
            ], 422);
        }

        $user = User::where('email', $email)->first();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Akun tidak ditemukan.'], 404);
        }

        $user->forceFill(['password' => $request->string('password')])->save();

        // Cabut semua token lama demi keamanan setelah password berubah.
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah. Silakan login kembali.',
        ]);
    }

    /**
     * POST /api/auth/resend-otp
     */
    public function resendOtp(ResendOtpRequest $request): JsonResponse
    {
        $email = strtolower($request->string('email'));
        $purpose = $request->string('purpose');

        $cooldown = (int) config('otp.resend_cooldown_seconds', 60);
        $last = Otp::where('email', $email)->where('purpose', $purpose)->latest('id')->first();

        $user = User::where('email', $email)->first();

        // Response sengaja tetap generik untuk mencegah enumerasi akun.
        $cooldownPassed = ! $last || $last->created_at->diffInSeconds(now()) >= $cooldown;
        if ($cooldownPassed && $user && ($purpose === 'reset_password' || ! $user->email_verified_at)) {
            $this->otp->generate($email, $purpose, $request->ip());
        }

        return response()->json([
            'success' => true,
            'message' => 'Jika permintaan valid, kode OTP baru telah dikirim.',
        ]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'profile' => $user->profile,
        ];
    }
}
