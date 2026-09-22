<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationFile extends Model
{
    protected $fillable = [
        'uploaded_by',
        'label',
        'original_name',
        'disk',
        'path',
        'mime_type',
        'size',
    ];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }
}