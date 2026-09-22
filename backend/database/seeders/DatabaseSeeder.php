<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seeder ini HANYA untuk kebutuhan development/staging.
     * JANGAN dijalankan di production dengan kredensial di bawah ini.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@dsjs-brin.com'],
            [
                'name' => 'Admin DSJS',
                'phone' => '081234567890',
                'password' => 'admin123', // wajib diganti setelah seed pertama di lingkungan nyata
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'user@dsjs-brin.com'],
            [
                'name' => 'User Demo',
                'phone' => '081298765432',
                'password' => 'user123',
                'role' => 'user',
                'email_verified_at' => now(),
            ]
        );
    }
}
