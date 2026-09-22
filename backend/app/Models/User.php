<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'is_active',
        // Dibutuhkan agar admin bisa membuat user yang langsung terverifikasi
        // (Admin\UserController::store). Aman: seluruh controller menyusun array
        // secara eksplisit, tidak pernah mass-assign request mentah.
        'email_verified_at',
    ];

    // password & remember_token TIDAK PERNAH ikut ter-serialize ke JSON/array.
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed', // otomatis di-bcrypt saat diset, mencegah lupa hash di controller
            'is_active' => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }

    public function drafts()
    {
        return $this->hasMany(Draft::class);
    }

    protected function role(): Attribute
    {
        // Guard tambahan: role hanya boleh 'user' atau 'admin', apa pun yang masuk di luar itu dipaksa 'user'.
        return Attribute::make(
            set: fn (string $value) => in_array($value, ['user', 'admin'], true) ? $value : 'user',
        );
    }
}
