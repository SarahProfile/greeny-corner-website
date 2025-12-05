<?php

use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\FirebaseAuthController;
use App\Http\Controllers\API\HelpMessageController;
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
Route::get('/debug/config', function() {
    return response()->json([
        'plantnet_configured' => env('PLANTNET_API_KEY') ? 'Yes (key exists)' : 'No',
        'gemini_configured' => env('GEMINI_API_KEY') ? 'Yes (key exists)' : 'No',
        'storage_path' => storage_path('app/public/plants'),
        'storage_exists' => file_exists(storage_path('app/public/plants')),
        'storage_writable' => is_writable(storage_path('app/public')),
        'php_upload_max' => ini_get('upload_max_filesize'),
        'php_post_max' => ini_get('post_max_size'),
    ]);
});

// New Gemini-based plant data retrieval (public - no auth required)
Route::get('/plants/by-name', [PlantController::class, 'getPlantByName']);

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

    // Gemini-based identification and data refresh
    Route::post('plants/identify-gemini', [PlantController::class, 'identifyWithGemini']);
    Route::put('plants/{id}/refresh-gemini', [PlantController::class, 'refreshGeminiData']);
    Route::get('plants/{id}/diseases-nutrition', [PlantController::class, 'getDiseasesAndNutrition']);

    // Help Messages
    Route::post('help-messages', [HelpMessageController::class, 'store']);
    Route::get('help-messages', [HelpMessageController::class, 'index']);

    // Admin Routes
    Route::prefix('admin')->group(function () {
        Route::get('dashboard/stats', [AdminController::class, 'getDashboardStats']);
        Route::get('dashboard/user-growth', [AdminController::class, 'getUserGrowth']);
        Route::get('dashboard/plant-additions', [AdminController::class, 'getPlantAdditions']);
        Route::get('dashboard/popular-plants', [AdminController::class, 'getPopularPlants']);
        Route::get('dashboard/message-categories', [AdminController::class, 'getMessageCategories']);
        Route::get('users', [AdminController::class, 'getUsers']);
        Route::get('messages', [AdminController::class, 'getHelpMessages']);
        Route::put('messages/{id}/status', [AdminController::class, 'updateMessageStatus']);
    });
});