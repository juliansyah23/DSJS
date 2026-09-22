<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    protected $fillable = [
        'age_group',
        'color_blind',
        'service_model',
        'internet_condition',
    ];

    protected function casts(): array
    {
        return ['color_blind' => 'boolean'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}