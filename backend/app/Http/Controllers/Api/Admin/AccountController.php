<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;

class AccountController extends Controller
{
    public function update(Request $request, AuditService $audit): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'min:3', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'current_password' => ['required_with:password', 'current_password:sanctum'],
            'password' => ['sometimes', 'required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);
        $user = $request->user();
        DB::transaction(function () use ($user, $data, $request, $audit) {
            $before = $user->only(['name', 'phone']);
            $user->fill(collect($data)->only(['name', 'phone', 'password'])->all())->save();
            if (isset($data['password'])) {
                $user->tokens()->delete();
            }
            $audit->record($request, 'account.updated', $user, $before, [
                ...$user->only(['name', 'phone']),
                'password_changed' => isset($data['password']),
            ]);
        });

        return response()->json(['success' => true, 'message' => 'Akun berhasil diperbarui.', 'data' => [
            'user' => $user->only(['id', 'name', 'email', 'phone']),
            'requires_login' => isset($data['password']),
        ]]);
    }
}