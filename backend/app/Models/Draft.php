<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Draft extends Model
{
    protected $fillable = [
        'service_type',
        'current_step',
        'skip_company',
        'form_data',
    ];

    protected function casts(): array
    {
        return [
            'skip_company' => 'boolean',
            'form_data' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}