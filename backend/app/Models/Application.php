<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'officer_id',
        'application_code',
        'service_type',
        'applicant_name',
        'company_name',
        'status',
        'form_data',
        'submitted_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'form_data' => 'array',
            'submitted_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function officer()
    {
        return $this->belongsTo(User::class, 'officer_id');
    }

    public function stages()
    {
        return $this->hasMany(ApplicationStage::class)->orderBy('sequence');
    }

    public function files()
    {
        return $this->hasMany(ApplicationFile::class);
    }
}