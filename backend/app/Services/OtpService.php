<?php

namespace App\Services;

use App\Models\Otp;
use App\Notifications\OtpNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Throwable;

class OtpService
{
    /**
     * Buat & "kirim" OTP baru untuk email + tujuan tertentu.
     * OTP lama yang masih aktif (belum dipakai) untuk kombinasi email+purpose yang sama akan dibatalkan,
     * supaya hanya satu kode yang valid pada satu waktu.
     */
    public function generate(string $email, string $purpose, ?string $ip = null): Otp
    {
        Otp::where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]); // invalidate kode lama

        $length = (int) config('otp.length', 6);
        $code = str_pad((string) random_int(0, (10 ** $length) - 1), $length, '0', STR_PAD_LEFT);

        $otp = Otp::create([
            'email' => $email,
            'code_hash' => Hash::make($code),
            'purpose' => $purpose,
            'attempts' => 0,
            'expires_at' => now()->addMinutes((int) config('otp.expiry_minutes', 5)),
            'ip_address' => $ip,
        ]);

        $this->deliver($email, $code, $purpose);

        return $otp;
    }

    /**
     * Verifikasi kode OTP. Mengembalikan true/false, dan menaikkan attempts pada percobaan gagal
     * agar kode terkunci (tak bisa dipakai lagi) setelah OTP_MAX_ATTEMPTS kali salah.
     */
    public function verify(string $email, string $purpose, string $code): bool
    {
        $otp = Otp::where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->latest('id')
            ->first();

        if (! $otp || $otp->isExpired()) {
            return false;
        }

        $maxAttempts = (int) config('otp.max_attempts', 5);
        if ($otp->attempts >= $maxAttempts) {
            return false;
        }

        if (! Hash::check($code, $otp->code_hash)) {
            $otp->increment('attempts');

            return false;
        }

        $otp->update(['consumed_at' => now()]);

        return true;
    }

    private function deliver(string $email, string $code, string $purpose): void
    {
        try {
            Notification::route('mail', $email)->notify(new OtpNotification(
                $code,
                $purpose,
                (int) config('otp.expiry_minutes', 5),
            ));
        } catch (Throwable $exception) {
            if (! app()->environment(['local', 'testing'])) {
                throw $exception;
            }

            Log::warning('Pengiriman email OTP gagal; fallback lokal digunakan.', [
                'email' => $email,
                'purpose' => $purpose,
                'code' => $code,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
