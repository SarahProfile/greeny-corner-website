<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\FirebaseAuthController;
use App\Http\Controllers\API\MobileAuthController;
use App\Http\Controllers\API\PlantController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Mobile authentication routes
Route::post('/mobile/forgot-password/phone', [MobileAuthController::class, 'requestPhoneReset']);
Route::post('/mobile/forgot-password/verify', [MobileAuthController::class, 'verifyPhoneResetCode']);
Route::post('/mobile/link-email', [MobileAuthController::class, 'linkEmailToPhone']);

// Firebase Authentication routes
Route::post('/auth/firebase', [FirebaseAuthController::class, 'authenticate']);
Route::post('/auth/firebase/verify', [FirebaseAuthController::class, 'verifyToken']);


// Public routes (no authentication required)
Route::get('/plants/api-capabilities', [PlantController::class, 'getPlantRecogCapabilities']);
Route::post('/plants/identify', [PlantController::class, 'identify']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Mobile auth routes (require special token permissions)
    Route::post('/mobile/reset-password', [MobileAuthController::class, 'resetPasswordWithToken']);
    
    Route::resource('plants', PlantController::class)->only(['index', 'store', 'show', 'destroy']);
    Route::put('plants/{id}/water', [PlantController::class, 'waterPlant']);
    Route::put('plants/{id}/fertilize', [PlantController::class, 'fertilizePlant']);
    Route::put('plants/{id}/till', [PlantController::class, 'tillPlant']);
    Route::put('plants/{id}/schedule', [PlantController::class, 'updateSchedule']);
    Route::post('plants/{id}/update-image', [PlantController::class, 'updatePlantImage']);
    Route::post('plants/refresh-language', [PlantController::class, 'refreshPlantsLanguage']);
});