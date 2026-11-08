<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Plant care text (details, diseases, nutrition) from an AI model.
 *
 * Despite the name this no longer talks to Google directly: every call goes through OpenRouter
 * (OPENROUTER_API_KEY), so no Gemini API key is needed. The class name is kept because the
 * controllers call it by that name.
 */
class GeminiService
{
    private const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
    // Falls through to the next model only on rate limits (429). google/gemini-flash-1.5 and
    // google/gemini-2.0-flash-lite:free were retired from OpenRouter's catalog (Gemini moved to
    // the 3.x line) — kept current 2026-09-22.
    private const MODELS = ['google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite', 'google/gemma-4-31b-it:free'];
    // Zero-cost model tried first for low-stakes content (e.g. plant symbolism). The caller
    // (PlantController::getPlantMeaning) falls back to complete()'s cheap paid models when this
    // is rate-limited, so a busy free tier no longer means "try again" for the user — that's an
    // explicit, user-approved cost/reliability trade-off, not an oversight. Not a Gemini model —
    // Gemini currently has no free tier on OpenRouter — but still $0 and still Google.
    private const FREE_MODEL = 'google/gemma-4-31b-it:free';

    private $apiKey;

    public function __construct()
    {
        $this->apiKey = env('OPENROUTER_API_KEY');
    }

    /**
     * One prompt -> model text, or null. max_tokens is generous because the model's reasoning
     * tokens count toward it and a truncated JSON answer is useless.
     */
    public function complete(string $prompt, int $maxTokens = 8000): ?string
    {
        foreach (self::MODELS as $model) {
            try {
                $response = Http::timeout(60)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $this->apiKey,
                        'HTTP-Referer' => 'https://greenycorner.ae',
                        'X-Title' => 'Greeny Corner',
                    ])
                    ->post(self::OPENROUTER_URL, [
                        'model' => $model,
                        'messages' => [['role' => 'user', 'content' => $prompt]],
                        'max_tokens' => $maxTokens,
                        'temperature' => 0.4,
                    ]);
            } catch (\Throwable $e) {
                Log::error('OpenRouter call failed: ' . $e->getMessage());
                return null;
            }

            if ($response->status() === 429) {
                Log::warning("OpenRouter model {$model} rate limited, trying next model");
                continue;
            }
            if (!$response->successful()) {
                Log::error('OpenRouter request failed', ['status' => $response->status(), 'body' => substr($response->body(), 0, 300)]);
                return null;
            }

            $text = trim((string) $response->json('choices.0.message.content'));
            return $text !== '' ? $text : null;
        }

        return null;
    }

    /**
     * Same as complete(), but pinned to the free-tier model with no fallback to a paid one —
     * for content where "try again in a minute" beats spending money. The free tier has its own,
     * stricter rate limits, so a null return (caller should show a friendly retry message) is
     * more likely here than from complete().
     */
    public function completeFree(string $prompt, int $maxTokens = 800): ?string
    {
        if (!$this->apiKey) {
            Log::warning('OpenRouter API key not configured');
            return null;
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'HTTP-Referer' => 'https://greenycorner.ae',
                    'X-Title' => 'Greeny Corner',
                ])
                ->post(self::OPENROUTER_URL, [
                    'model' => self::FREE_MODEL,
                    'messages' => [['role' => 'user', 'content' => $prompt]],
                    'max_tokens' => $maxTokens,
                    'temperature' => 0.5,
                ]);
        } catch (\Throwable $e) {
            Log::error('OpenRouter free-tier call failed: ' . $e->getMessage());
            return null;
        }

        if (!$response->successful()) {
            Log::warning('OpenRouter free-tier model failed', ['status' => $response->status(), 'body' => substr($response->body(), 0, 300)]);
            return null;
        }

        $text = trim((string) $response->json('choices.0.message.content'));
        return $text !== '' ? $text : null;
    }

    public function getPlantDetails(string $plantName, string $language = 'en'): ?array
    {
        if (!$this->apiKey) {
            Log::warning('OpenRouter API key not configured');
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

        Log::info("Requesting plant details for: {$plantName} in language: {$languageName}");

        $text = $this->complete($prompt);
        $parsed = $text ? $this->parseGeminiResponse($text) : null;
        if ($parsed) {
            Log::info('Successfully parsed plant details for: ' . $plantName);
        }
        return $parsed;
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

        // The model sometimes wraps the JSON in prose: take the outermost {...}
        if (preg_match('/\{[\s\S]*\}/u', $text, $m)) {
            $decoded = json_decode($m[0], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        Log::warning('JSON decode error: ' . json_last_error_msg());

        return null;
    }

    public function getBilingualPlantDetails(string $plantName): array
    {
        $result = ['en' => null, 'ar' => null];
        $result['en'] = $this->getPlantDetails($plantName, 'en');
        $result['ar'] = $this->getPlantDetails($plantName, 'ar');
        return $result;
    }

    public function getDiseasesAndNutrition(string $plantName, string $language = 'en'): ?array
    {
        if (!$this->apiKey) {
            Log::warning('OpenRouter API key not configured');
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

        Log::info("Requesting diseases and nutrition for: {$plantName} in language: {$languageName}");

        $text = $this->complete($prompt);
        $parsed = $text ? $this->parseGeminiResponse($text) : null;
        if ($parsed) {
            Log::info('Successfully parsed diseases and nutrition for: ' . $plantName);
        }
        return $parsed;
    }

    public function getBilingualDiseasesAndNutrition(string $plantName): array
    {
        $result = ['en' => null, 'ar' => null];
        $result['en'] = $this->getDiseasesAndNutrition($plantName, 'en');
        $result['ar'] = $this->getDiseasesAndNutrition($plantName, 'ar');
        return $result;
    }
}
