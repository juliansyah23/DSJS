<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DraftRequest;
use App\Models\Draft;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DraftController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['drafts' => $request->user()->drafts()->latest('updated_at')->get()],
        ]);
    }

    public function store(DraftRequest $request): JsonResponse
    {
        $draft = $request->user()->drafts()->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Draft berhasil dibuat.',
            'data' => ['draft' => $draft],
        ], 201);
    }

    public function show(Request $request, Draft $draft): JsonResponse
    {
        $this->authorize('view', $draft);

        return response()->json(['success' => true, 'data' => ['draft' => $draft]]);
    }

    public function update(DraftRequest $request, Draft $draft): JsonResponse
    {
        $this->authorize('update', $draft);
        $draft->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Draft berhasil disimpan.',
            'data' => ['draft' => $draft->fresh()],
        ]);
    }

    public function destroy(Request $request, Draft $draft): JsonResponse
    {
        $this->authorize('delete', $draft);
        $draft->delete();

        return response()->json(['success' => true, 'message' => 'Draft berhasil dihapus.']);
    }
}