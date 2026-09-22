<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['profile' => $request->user()->profile],
        ]);
    }

    public function update(ProfileRequest $request): JsonResponse
    {
        $profile = $request->user()->profile()->updateOrCreate(
            [],
            $request->validated(),
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan simulasi berhasil disimpan.',
            'data' => ['profile' => $profile],
        ]);
    }
}