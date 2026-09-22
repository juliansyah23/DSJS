<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Models\Application;
use App\Models\ApplicationFile;
use App\Models\Draft;
use App\Support\ApplicationData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class ApplicationController extends Controller
{
    private const STAGES = [
        'Permohonan Diterima',
        'Verifikasi Dokumen',
        'Review Teknis',
        'Persetujuan Pejabat',
        'SK Diterbitkan',
    ];

    public function index(Request $request): JsonResponse
    {
        $applications = $request->user()->applications()
            ->with(['stages', 'officer'])
            ->latest('submitted_at')
            ->get()
            ->map(fn (Application $application) => ApplicationData::make($application));

        return response()->json(['success' => true, 'data' => ['applications' => $applications]]);
    }

    public function store(StoreApplicationRequest $request): JsonResponse
    {
        $storedFiles = [];

        try {
            $application = DB::transaction(function () use ($request, &$storedFiles) {
                $form = $request->validated('form_data');
                $application = $request->user()->applications()->create([
                    'application_code' => $this->uniqueCode(),
                    'service_type' => $request->validated('service_type'),
                    'applicant_name' => $form['name'],
                    'company_name' => $request->boolean('skip_company') ? null : ($form['companyName'] ?? null),
                    'status' => 'pending',
                    'form_data' => $form,
                    'submitted_at' => now(),
                ]);

                foreach (self::STAGES as $index => $name) {
                    $application->stages()->create([
                        'sequence' => $index + 1,
                        'name' => $name,
                        'status' => $index === 0 ? 'completed' : ($index === 1 ? 'in_progress' : 'pending'),
                        'started_at' => $index <= 1 ? now() : null,
                        'completed_at' => $index === 0 ? now() : null,
                    ]);
                }

                foreach ($request->file('files', []) as $index => $uploadedFile) {
                    $path = $uploadedFile->storeAs(
                        (string) $application->id,
                        Str::uuid().'.pdf',
                        'application_files',
                    );
                    $storedFiles[] = $path;

                    $application->files()->create([
                        'uploaded_by' => $request->user()->id,
                        'label' => $request->validated('file_labels')[$index],
                        'original_name' => mb_substr($uploadedFile->getClientOriginalName(), 0, 255),
                        'disk' => 'application_files',
                        'path' => $path,
                        'mime_type' => $uploadedFile->getMimeType() ?: 'application/pdf',
                        'size' => $uploadedFile->getSize(),
                    ]);
                }

                if ($request->filled('draft_id')) {
                    Draft::whereKey($request->integer('draft_id'))
                        ->where('user_id', $request->user()->id)
                        ->delete();
                }

                return $application;
            });
        } catch (Throwable $exception) {
            foreach ($storedFiles as $path) {
                Storage::disk('application_files')->delete($path);
            }
            throw $exception;
        }

        return response()->json([
            'success' => true,
            'message' => 'Permohonan berhasil diajukan.',
            'data' => ['application' => ApplicationData::make($application->fresh(), true)],
        ], 201);
    }

    public function show(Request $request, Application $application): JsonResponse
    {
        $this->authorize('view', $application);

        return response()->json([
            'success' => true,
            'data' => ['application' => ApplicationData::make($application, true)],
        ]);
    }

    public function download(Request $request, Application $application, ApplicationFile $file): StreamedResponse
    {
        $this->authorize('downloadFile', $application);
        abort_unless($file->application_id === $application->id, 404);
        abort_unless(Storage::disk($file->disk)->exists($file->path), 404, 'Berkas tidak ditemukan.');

        return Storage::disk($file->disk)->download($file->path, $file->original_name, [
            'Content-Type' => $file->mime_type,
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function uniqueCode(): string
    {
        do {
            $code = 'DSJ-'.now()->format('Y').'-'.strtoupper(Str::random(8));
        } while (Application::where('application_code', $code)->exists());

        return $code;
    }
}