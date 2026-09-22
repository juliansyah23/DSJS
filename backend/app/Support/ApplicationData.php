<?php

namespace App\Support;

use App\Models\Application;

class ApplicationData
{
    private const SERVICE_LABELS = [
        'sip' => 'Surat Ijin Praktek (SIP)',
        'oss' => 'Perijinan Berusaha (OSS RBA)',
        'simbg' => 'SIMBG',
    ];

    public static function make(Application $application, bool $includePrivate = false): array
    {
        $application->loadMissing(['stages', 'officer']);

        $data = [
            'id' => $application->id,
            'code' => $application->application_code,
            'service_type' => $application->service_type,
            'service_label' => self::SERVICE_LABELS[$application->service_type] ?? $application->service_type,
            'applicant_name' => $application->applicant_name,
            'company_name' => $application->company_name,
            'status' => $application->status,
            'submitted_at' => $application->submitted_at?->toISOString(),
            'completed_at' => $application->completed_at?->toISOString(),
            'officer' => $application->officer ? [
                'id' => $application->officer->id,
                'name' => $application->officer->name,
            ] : null,
            'stages' => $application->stages->map(fn ($stage) => [
                'id' => $stage->id,
                'sequence' => $stage->sequence,
                'name' => $stage->name,
                'status' => $stage->status,
                'notes' => $stage->notes,
                'started_at' => $stage->started_at?->toISOString(),
                'completed_at' => $stage->completed_at?->toISOString(),
            ])->values(),
        ];

        if ($includePrivate) {
            $application->loadMissing('files');
            $data['form_data'] = $application->form_data;
            $data['files'] = $application->files->map(fn ($file) => [
                'id' => $file->id,
                'label' => $file->label,
                'original_name' => $file->original_name,
                'mime_type' => $file->mime_type,
                'size' => $file->size,
            ])->values();
        }

        return $data;
    }
}