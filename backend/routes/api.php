<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\DraftController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TrackController;
use App\Http\Controllers\Api\Admin\ApplicationController as AdminApplicationController;
use App\Http\Controllers\Api\Admin\AuditLogController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Digital Service Journey
|--------------------------------------------------------------------------
| Semua rute di file ini otomatis diprefix "/api" oleh bootstrap/app.php.
| Auth pakai Sanctum personal access token (Authorization: Bearer <token>),
| bukan cookie session — jadi aman dikonsumsi oleh SPA React yang terpisah domain/port.
*/

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:otp');
    Route::post('/resend-otp', [AuthController::class, 'resendOtp'])->middleware('throttle:otp');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:otp');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:otp');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::get('/track/{code}', [TrackController::class, 'show'])->middleware('throttle:track');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    Route::apiResource('drafts', DraftController::class);

    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::post('/applications', [ApplicationController::class, 'store'])->middleware('throttle:upload');
    Route::get('/applications/{application}', [ApplicationController::class, 'show']);
    Route::get('/applications/{application}/files/{file}', [ApplicationController::class, 'download']);
});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::patch('/account', [\App\Http\Controllers\Api\Admin\AccountController::class, 'update'])->middleware('throttle:6,1');
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/notifications', [DashboardController::class, 'notifications']);
    Route::get('/applications', [AdminApplicationController::class, 'index']);
    Route::patch('/applications/{application}', [AdminApplicationController::class, 'update']);
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::patch('/users/{user}', [UserController::class, 'update']);
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
});
