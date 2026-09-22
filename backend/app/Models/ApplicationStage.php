<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationStage extends Model
{
    protected $fillable = [
        'sequence',
        'name',
        'status',
        'notes',
        'started_at',
        'completed_at',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function application()
    {
        return $this->belongsTo(Application::class);
    }
}