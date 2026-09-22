<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    private const SERVICE_LABELS = ['sip' => 'SIP', 'oss' => 'OSS RBA', 'simbg' => 'SIMBG'];

    public function stats(Request $request): JsonResponse
    {
        $period = max(7, min(365, $request->integer('period', 30)));
        $all = Application::with('stages')->get();
        $periodApps = $all->filter(fn ($app) => $app->submitted_at->gte(now()->subDays($period)));

        $monthly = collect(range(11, 0))->map(function ($offset) use ($all) {
            $month = now()->startOfMonth()->subMonths($offset);
            $items = $all->filter(fn ($app) => $app->submitted_at->isSameMonth($month));

            return [
                'month' => $month->translatedFormat('M'),
                'apps' => $items->count(),
                'approved' => $items->where('status', 'approved')->count(),
            ];
        });

        $statusLabels = [
            'approved' => ['name' => 'Disetujui', 'color' => '#22C55E'],
            'review' => ['name' => 'Diproses', 'color' => '#2563EB'],
            'pending' => ['name' => 'Verifikasi', 'color' => '#F59E0B'],
            'rejected' => ['name' => 'Ditolak', 'color' => '#EF4444'],
        ];
        $status = collect($statusLabels)->map(fn ($meta, $key) => [
            ...$meta,
            'status' => $key,
            'value' => $periodApps->where('status', $key)->count(),
        ])->values();

        $processing = collect(self::SERVICE_LABELS)->map(function ($label, $type) use ($all) {
            $completed = $all->where('service_type', $type)->filter(fn ($app) => $app->completed_at);
            $average = $completed->avg(fn ($app) => $app->submitted_at->floatDiffInDays($app->completed_at));

            return ['service' => $label, 'days' => round((float) ($average ?? 0), 1)];
        })->values();

        $targets = [1 => 1, 2 => 2, 3 => 3, 4 => 2, 5 => 1];
        $bottlenecks = collect(range(1, 5))->map(function ($sequence) use ($all, $targets) {
            $stages = $all->flatMap->stages
                ->where('sequence', $sequence)
                ->filter(fn ($stage) => $stage->started_at && $stage->completed_at);
            $average = $stages->avg(fn ($stage) => $stage->started_at->floatDiffInDays($stage->completed_at));

            return [
                'stage' => $stages->first()?->name ?? ['Permohonan Diterima', 'Verifikasi Dokumen', 'Review Teknis', 'Persetujuan Pejabat', 'SK Diterbitkan'][$sequence - 1],
                'avg' => round((float) ($average ?? 0), 1),
                'target' => $targets[$sequence],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total' => $periodApps->count(),
                    'approved' => $periodApps->where('status', 'approved')->count(),
                    'processing' => $periodApps->whereIn('status', ['pending', 'review'])->count(),
                    'rejected' => $periodApps->where('status', 'rejected')->count(),
                    'users' => User::count(),
                ],
                'monthly_apps' => $monthly,
                'status_distribution' => $status,
                'processing_time' => $processing,
                'bottlenecks' => $bottlenecks,
            ],
        ]);
    }

    public function notifications(): JsonResponse
    {
        $new = Application::where('status', 'pending')->latest('submitted_at')->limit(5)->get()->map(fn ($app) => [
            'id' => 'new-'.$app->id,
            'type' => 'new',
            'title' => 'Permohonan Baru',
            'message' => "{$app->application_code} telah masuk dan menunggu verifikasi.",
            'created_at' => $app->submitted_at->toISOString(),
        ]);

        $overdue = Application::whereIn('status', ['pending', 'review'])
            ->where('submitted_at', '<', now()->subDays(14))
            ->latest('submitted_at')
            ->limit(5)
            ->get()
            ->map(fn ($app) => [
                'id' => 'sla-'.$app->id,
                'type' => 'overdue',
                'title' => 'Batas Waktu Terlampaui',
                'message' => "{$app->application_code} telah melewati SLA 14 hari.",
                'created_at' => $app->submitted_at->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'data' => ['notifications' => $new->concat($overdue)->sortByDesc('created_at')->values()],
        ]);
    }
}