<?php

/**
 * ADD THESE METHODS TO YOUR PlantController class
 * 
 * These methods implement the new Gemini-based plant identification flow:
 * 1. PlantNet identifies the plant name
 * 2. Gemini generates detailed bilingual plant data
 * 3. Data is cached in database to avoid re-fetching
 */

use App\Services\GeminiService;

/**
 * Get plant data by name with language support
 * GET /api/plants/by-name?name=Ficus-lyrata&lang=ar
 */
public function getPlantByName(Request $request)
{
    $plantName = $request->query('name');
    $language = $request->query('lang', 'en'); // default to English

    if (!$plantName) {
        return response()->json([
            'success' => false,
            'message' => 'Plant name is required'
        ], 400);
    }

    // Normalize plant name (replace hyphens with spaces)
    $normalizedName = str_replace('-', ' ', $plantName);

    // Check if we have this plant in database with Gemini data
    $plant = \App\Models\Plant::where('name', 'LIKE', "%{$normalizedName}%")
        ->orWhere('scientific_name', 'LIKE', "%{$normalizedName}%")
        ->where('gemini_data_fetched', true)
        ->first();

    if ($plant) {
        \Log::info("Found existing plant in database: {$plant->name}");
        
        // Return the appropriate language data
        $plantData = $language === 'ar' ? $plant->plant_data_ar : $plant->plant_data_en;

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $plant->id,
                'name' => $plant->name,
                'scientific_name' => $plant->scientific_name,
                'image_url' => $plant->image_url,
                'plant_data' => $plantData,
                'language' => $language
            ]
        ]);
    }

    // If not in database, we need to fetch from Gemini
    // But this requires having at least basic plant info first
    return response()->json([
        'success' => false,
        'message' => 'Plant data not found. Please identify the plant first using the identify endpoint.'
    ], 404);
}

/**
 * Enhanced identify method that uses PlantNet + Gemini
 * This replaces or extends your existing identify method
 */
public function identifyWithGemini(Request $request)
{
    if (!$request->hasFile('image')) {
        return response()->json([
            'message' => 'No image file received',
            'error' => 'Please ensure the image is properly selected and uploaded'
        ], 400);
    }

    $language = $request->input('language', 'en');

    try {
        $image = $request->file('image');
        $imagePath = $image->store('plant_images', 'public');
        $fullPath = storage_path('app/public/' . $imagePath);

        \Log::info('Image uploaded to: ' . $fullPath);

        // Step 1: Use PlantNet to identify plant name only
        $plantNetResult = $this->identifyWithPlantNetOnly($fullPath);

        if (!$plantNetResult || !isset($plantNetResult['name'])) {
            return response()->json([
                'success' => false,
                'message' => 'Could not identify plant from image'
            ], 400);
        }

        $plantName = $plantNetResult['name'];
        $scientificName = $plantNetResult['scientific_name'] ?? $plantName;

        \Log::info("PlantNet identified plant: {$plantName}");

        // Step 2: Check if we already have Gemini data for this plant
        $existingPlant = \App\Models\Plant::where('scientific_name', $scientificName)
            ->where('gemini_data_fetched', true)
            ->first();

        if ($existingPlant) {
            \Log::info("Using existing Gemini data for: {$plantName}");
            
            return response()->json([
                'success' => true,
                'identification' => [
                    'name' => $existingPlant->name,
                    'scientific_name' => $existingPlant->scientific_name,
                    'confidence' => $plantNetResult['confidence'] ?? 0.8
                ],
                'plant_data' => $language === 'ar' ? $existingPlant->plant_data_ar : $existingPlant->plant_data_en,
                'source' => 'cached'
            ]);
        }

        // Step 3: Fetch detailed data from Gemini for both languages
        $geminiService = app(GeminiService::class);
        $bilingualData = $geminiService->getBilingualPlantDetails($plantName);

        if (!$bilingualData['en'] || !$bilingualData['ar']) {
            \Log::warning("Gemini failed to generate data for: {$plantName}");
            
            return response()->json([
                'success' => true,
                'identification' => [
                    'name' => $plantName,
                    'scientific_name' => $scientificName,
                    'confidence' => $plantNetResult['confidence'] ?? 0.8
                ],
                'message' => 'Plant identified but detailed data could not be generated',
                'source' => 'plantnet_only'
            ]);
        }

        // Step 4: Store the plant with bilingual Gemini data
        $newPlant = \App\Models\Plant::create([
            'user_id' => auth()->id(),
            'name' => $plantName,
            'scientific_name' => $scientificName,
            'image_url' => '/storage/' . $imagePath,
            'plant_data_en' => $bilingualData['en'],
            'plant_data_ar' => $bilingualData['ar'],
            'gemini_data_fetched' => true,
            'gemini_fetched_at' => now(),
            'added_at' => now()
        ]);

        \Log::info("Successfully created plant with Gemini data: {$plantName}");

        return response()->json([
            'success' => true,
            'plant' => $newPlant,
            'plant_data' => $language === 'ar' ? $bilingualData['ar'] : $bilingualData['en'],
            'source' => 'gemini'
        ]);

    } catch (\Exception $e) {
        \Log::error('Plant identification failed: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to identify plant',
            'error' => $e->getMessage()
        ], 500);
    }
}

/**
 * Helper method: Use PlantNet API ONLY for plant name extraction
 */
private function identifyWithPlantNetOnly($imagePath): ?array
{
    $apiKey = env('PLANTNET_API_KEY');
    
    if (!$apiKey) {
        \Log::warning('PlantNet API key not configured');
        return null;
    }

    if (!file_exists($imagePath)) {
        \Log::error('Image file not found: ' . $imagePath);
        return null;
    }

    try {
        $apiUrl = 'https://my-api.plantnet.org/v2/identify/all';
        
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => $apiUrl . '?api-key=' . $apiKey,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => [
                'images' => new \CURLFile($imagePath, mime_content_type($imagePath)),
                'organs' => 'auto'
            ],
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            
            if (isset($data['results']) && count($data['results']) > 0) {
                $topResult = $data['results'][0];
                
                return [
                    'name' => $topResult['species']['commonNames'][0] ?? $topResult['species']['scientificNameWithoutAuthor'],
                    'scientific_name' => $topResult['species']['scientificNameWithoutAuthor'],
                    'confidence' => $topResult['score'] ?? 0,
                ];
            }
        }

        return null;
    } catch (\Exception $e) {
        \Log::error('PlantNet API error: ' . $e->getMessage());
        return null;
    }
}

/**
 * Refresh/regenerate Gemini data for an existing plant
 * PUT /api/plants/{id}/refresh-gemini
 */
public function refreshGeminiData($id)
{
    $plant = \App\Models\Plant::findOrFail($id);

    // Ensure user owns this plant
    if ($plant->user_id !== auth()->id()) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized'
        ], 403);
    }

    $plantName = $plant->scientific_name ?? $plant->name;
    
    $geminiService = app(GeminiService::class);
    $bilingualData = $geminiService->getBilingualPlantDetails($plantName);

    if ($bilingualData['en'] && $bilingualData['ar']) {
        $plant->update([
            'plant_data_en' => $bilingualData['en'],
            'plant_data_ar' => $bilingualData['ar'],
            'gemini_data_fetched' => true,
            'gemini_fetched_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Plant data refreshed successfully',
            'plant' => $plant
        ]);
    }

    return response()->json([
        'success' => false,
        'message' => 'Failed to refresh plant data'
    ], 500);
}
