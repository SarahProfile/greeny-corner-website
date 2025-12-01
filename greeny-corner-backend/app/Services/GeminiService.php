<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private $apiKey;
    private $apiUrl;

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY');
        $this->apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    }

    public function getPlantDetails(string $plantName, string $language = 'en'): ?array
    {
        if (!$this->apiKey) {
            Log::warning('Gemini API key not configured');
            return null;
        }

        $languageName = $language === 'ar' ? 'Arabic' : 'English';

        $prompt = "Give me detailed plant information about '{$plantName}'. Provide structure: description, watering, sunlight, soil, temperature, climate, diseases, pests, propagation, pruning, toxicity, and care tips. Language: {$languageName}. Make the answer accurate, complete, and structured.

Please format your response as a JSON object with the following structure:
{
  \"description\": \"detailed description of the plant\",
  \"watering\": \"watering requirements and frequency\",
  \"sunlight\": \"light requirements\",
  \"soil\": \"soil type and pH requirements\",
  \"temperature\": \"ideal temperature range\",
  \"climate\": \"climate preferences\",
  \"diseases\": \"common diseases\",
  \"pests\": \"common pests\",
  \"propagation\": \"propagation methods\",
  \"pruning\": \"pruning requirements and tips\",
  \"toxicity\": \"toxicity information for pets and humans\",
  \"care_tips\": \"additional care tips and important notes\"
}";

        try {
            Log::info("Calling Gemini API for plant: {$plantName} in language: {$languageName}");

            $response = Http::timeout(30)->post($this->apiUrl . '?key=' . $this->apiKey, [
                'contents' => [[
                    'parts' => [['text' => $prompt]]
                ]],
                'generationConfig' => [
                    'temperature' => 0.4,
                    'topK' => 32,
                    'topP' => 1,
                    'maxOutputTokens' => 8192, // Increased from 2048
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

                if ($text) {
                    $parsed = $this->parseGeminiResponse($text);
                    
                    if ($parsed) {
                        Log::info('Successfully parsed Gemini response for: ' . $plantName);
                        return $parsed;
                    }
                }
            } else {
                Log::error('Gemini API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Gemini API call failed: ' . $e->getMessage());
            return null;
        }
    }

    private function parseGeminiResponse(string $text): ?array
    {
        // Remove markdown code blocks
        $text = preg_replace('/```json\s*/s', '', $text);
        $text = preg_replace('/```\s*/s', '', $text);
        $text = trim($text);

        // Clean special characters that might cause JSON parsing issues
        $text = str_replace(["\u00b0", "°"], "°", $text); // degree symbol
        $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8'); // Ensure UTF-8

        $decoded = json_decode($text, true);
        
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }
        
        Log::warning('JSON decode error: ' . json_last_error_msg());
        
        return null;
    }

    public function getBilingualPlantDetails(string $plantName): array
    {
        $result = ['en' => null, 'ar' => null];
        $result['en'] = $this->getPlantDetails($plantName, 'en');
        sleep(2); // Increased delay to avoid rate limiting
        $result['ar'] = $this->getPlantDetails($plantName, 'ar');
        return $result;
    }

    public function getDiseasesAndNutrition(string $plantName, string $language = 'en'): ?array
    {
        if (!$this->apiKey) {
            Log::warning('Gemini API key not configured');
            return null;
        }

        $languageName = $language === 'ar' ? 'Arabic' : 'English';

        $prompt = "For the plant '{$plantName}', provide comprehensive information about:
1. Common diseases that affect this plant (list at least 3-5 diseases)
2. How to protect the plant from each disease (prevention and treatment methods)
3. Nutritional requirements and fertilization needs

Please respond in {$languageName} language.

Format your response as JSON with this exact structure:
{
  \"diseases\": [
    {
      \"name\": \"disease name\",
      \"description\": \"brief description of the disease\",
      \"symptoms\": \"visible symptoms to look for\",
      \"prevention\": \"how to prevent this disease\",
      \"treatment\": \"how to treat if infected\"
    }
  ],
  \"nutrition\": {
    \"primary_nutrients\": \"NPK requirements (Nitrogen, Phosphorus, Potassium)\",
    \"secondary_nutrients\": \"other important nutrients\",
    \"fertilizer_type\": \"recommended fertilizer types\",
    \"feeding_frequency\": \"how often to fertilize\",
    \"feeding_season\": \"best seasons for fertilization\",
    \"special_notes\": \"any special nutritional requirements or tips\"
  }
}

Provide accurate, practical, and actionable information.";

        try {
            Log::info("Calling Gemini API for diseases and nutrition: {$plantName} in language: {$languageName}");

            $response = Http::timeout(30)->post($this->apiUrl . '?key=' . $this->apiKey, [
                'contents' => [[
                    'parts' => [['text' => $prompt]]
                ]],
                'generationConfig' => [
                    'temperature' => 0.4,
                    'topK' => 32,
                    'topP' => 1,
                    'maxOutputTokens' => 8192,
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

                if ($text) {
                    $parsed = $this->parseGeminiResponse($text);

                    if ($parsed) {
                        Log::info('Successfully parsed Gemini diseases and nutrition response for: ' . $plantName);
                        return $parsed;
                    }
                }
            } else {
                Log::error('Gemini API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Gemini API call failed: ' . $e->getMessage());
            return null;
        }
    }

    public function getBilingualDiseasesAndNutrition(string $plantName): array
    {
        $result = ['en' => null, 'ar' => null];
        $result['en'] = $this->getDiseasesAndNutrition($plantName, 'en');
        sleep(2); // Delay to avoid rate limiting
        $result['ar'] = $this->getDiseasesAndNutrition($plantName, 'ar');
        return $result;
    }
}
