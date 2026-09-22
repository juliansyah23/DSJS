<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateApplicationRequest;
use App\Models\Application;
use App\Services\AuditService;
use App\Support\ApplicationData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApplicationController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $query = Application::query()->with(['stages', 'officer']);

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('application_code', 'like', "%{$search}%")
                    ->orWhere('applicant_name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            });
        }
        if (in_array($request->query('service_type'), ['sip', 'oss', 'simbg'], true)) {
            $query->where('service_type', $request->query('service_type'));
        }
        if (in_array($request->query('status'), ['pending', 'review', 'approved', 'rejected'], true)) {
            $query->where('status', $request->query('status'));
        }

        $paginated = $query->latest('submitted_at')->paginate(min(100, max(1, $request->integer('per_page', 15))));
        $items = collect($paginated->items())->map(fn (Application $app) => ApplicationData::make($app, true));

        return response()->json([
            'success' => true,
            'data' => [
                'applications' => $items,
                'pagination' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                ],
            ],
        ]);
    }

    public function update(UpdateApplicationRequest $request, Application $application): JsonResponse
    {
        $after = DB::transaction(function () use ($request, $application) {
            $application = Application::query()->lockForUpdate()->findOrFail($application->id);
            $before = ApplicationData::make($application, true);
            if ($request->has('officer_id')) {
                $application->officer_id = $request->validated('officer_id');
            }
            if ($request->has('status')) {
                $previousStatus = $application->status;
                $application->status = $request->validated('status');
                if ($previousStatus !== $application->status) {
                    $application->completed_at = in_array($application->status, ['approved', 'rejected'], true) ? now() : null;
                }
            }
            $application->save();

            if ($request->has('stage_sequence')) {
                $stage = $application->stages()->where('sequence', $request->integer('stage_sequence'))->firstOrFail();
                $status = $request->validated('stage_status');
                $stage->update([
                    'status' => $status,
                    'notes' => $request->has('notes') ? $request->validated('notes') : $stage->notes,
                    'updated_by' => $request->user()->id,
                    'started_at' => $stage->started_at ?? ($status !== 'pending' ? now() : null),
                    'completed_at' => $stage->status === $status
                        ? $stage->completed_at
                        : (in_array($status, ['completed', 'rejected'], true) ? now() : null),
                ]);
            }

            $after = ApplicationData::make($application->fresh(), true);
            $this->audit->record($request, 'application.updated', $application, $before, $after);

            return $after;
        });

        return response()->json([
            'success' => true,
            'message' => 'Permohonan berhasil diperbarui.',
            'data' => ['application' => $after],
        ]);
    }
}