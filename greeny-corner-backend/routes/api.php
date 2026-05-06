<?php

use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\AppleAuthController;
use App\Http\Controllers\API\FirebaseAuthController;
use App\Http\Controllers\API\HelpMessageController;
use App\Http\Controllers\API\MobileAuthController;
use App\Http\Controllers\API\PlantController;
use App\Http\Controllers\API\PlantEncyclopediaController;
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
Route::post('/auth/apple', [AppleAuthController::class, 'authenticate']);


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

// Plant Encyclopedia (public - no auth required)
Route::prefix('encyclopedia')->group(function () {
    Route::get('/plants', [PlantEncyclopediaController::class, 'index']);
    Route::get('/plants/slugs', [PlantEncyclopediaController::class, 'slugs']);
    Route::get('/search', [PlantEncyclopediaController::class, 'search']);
    Route::get('/featured', [PlantEncyclopediaController::class, 'featured']);
    Route::get('/families', [PlantEncyclopediaController::class, 'families']);
    Route::get('/plants/{slug}/similar', [PlantEncyclopediaController::class, 'similar']);
    Route::get('/plants/{slug}', [PlantEncyclopediaController::class, 'show']);
});

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
    Route::post('plants/{id}/check-health', [PlantController::class, 'checkHealth']);
    Route::post('plants/refresh-language', [PlantController::class, 'refreshPlantsLanguage']);

    // Gemini-based identification and data refresh
    Route::post('plants/identify-gemini', [PlantController::class, 'identifyWithGemini']);
    Route::put('plants/{id}/refresh-gemini', [PlantController::class, 'refreshGeminiData']);
    Route::get('plants/{id}/diseases-nutrition', [PlantController::class, 'getDiseasesAndNutrition']);
    Route::post('plants/disease-treatment', [PlantController::class, 'getDiseaseTreatment']);
    Route::post('plants/{id}/fertilizer-info', [PlantController::class, 'getFertilizerInfo']);

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