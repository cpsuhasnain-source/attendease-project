<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\AttendanceController;

// Public login route
Route::post('/login', [AuthController::class, 'login']);

// Routes that require a valid Sanctum token
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Student CRUD
    Route::apiResource('students', StudentController::class);

    // Attendance CRUD
    Route::apiResource('attendance', AttendanceController::class);
});