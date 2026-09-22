<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Support\ApplicationData;
use Illuminate\Http\JsonResponse;

class TrackController extends Controller
{
    public function show(string $code): JsonResponse
    {
        abort_unless((bool) preg_match('/^DSJ-\d{4}-[A-Z0-9]{4,12}$/', strtoupper($code)), 404, 'Permohonan tidak ditemukan.');

        $application = Application::with(['stages', 'officer'])
            ->where('application_code', strtoupper($code))
            ->firstOrFail();

        $payload = ApplicationData::make($application);
        unset($payload['applicant_name'], $payload['company_name'], $payload['officer']);

        return response()->json([
            'success' => true,
            'data' => ['application' => $payload],
        ]);
    }
}