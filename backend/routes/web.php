<?php

use Illuminate\Support\Facades\Route;

// Backend ini API-only (dikonsumsi oleh frontend React terpisah).
// Rute web hanya dipakai untuk health-check dasar.
Route::get('/', function () {
    return response()->json([
        'app' => config('app.name'),
        'status' => 'ok',
    ]);
});
