<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:'.config('otp.length', 6)],
            // Verifikasi publik ini hanya mengaktifkan registrasi. OTP reset hanya
            // boleh dikonsumsi oleh endpoint reset-password dan tidak pernah issue token.
            'purpose' => ['required', 'in:register'],
        ];
    }
}
