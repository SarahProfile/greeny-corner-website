<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class TranslationService
{
    private GeminiService $gemini;

    /**
     * Create a new TranslationService instance.
     *
     * Previously used stichoza/google-translate-php, which scrapes Google Translate's public
     * endpoint with no API key. That's blocked with 429s from this server's IP in production
     * (and the package was also missing from api/'s deployed vendor tree). Routes through
     * OpenRouter instead, which is already proven reliable elsewhere in this app.
     */
    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Translate text from English to the specified language
     *
     * @param string $text Text to translate
     * @param string $targetLang Target language code (en, ar)
     * @param string $sourceLang Source language code (default: en)
     * @return string Translated text
     */
    public function translate(string $text, string $targetLang = 'ar', string $sourceLang = 'en'): string
    {
        // If target language is English or same as source, return original text
        if ($targetLang === 'en' || $targetLang === $sourceLang) {
            return $text;
        }

        // Text that is already Arabic must never be machine-translated "from English" again
        if ($targetLang === 'ar' && preg_match('/\p{Arabic}/u', $text)) {
            return $text;
        }

        if (trim($text) === '') {
            return $text;
        }

        // Create a cache key based on text and languages
        $cacheKey = 'translation_' . md5($text . $sourceLang . $targetLang);

        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        $langName = $targetLang === 'ar' ? 'Arabic' : $targetLang;
        $prompt = "Translate the following plant-care text from English to {$langName}. "
            . "Reply with ONLY the translation — no quotes, no explanation, no markdown:\n\n{$text}";

        try {
            // Free tier first (this runs on every plant page view, often many strings per
            // plant — keeping it $0 when possible matters), paid model if that's rate-limited.
            $translated = $this->gemini->completeFree($prompt, 500) ?? $this->gemini->complete($prompt, 500);
        } catch (\Throwable $e) {
            Log::error('Translation failed: ' . $e->getMessage(), [
                'text' => substr($text, 0, 50),
                'from' => $sourceLang,
                'to' => $targetLang,
            ]);
            return $text;
        }

        if (!$translated) {
            Log::warning('Translation returned nothing (free and paid models both unavailable)', [
                'text' => substr($text, 0, 50),
            ]);
            // Deliberately not cached: a transient outage shouldn't lock in the failure for 30 days.
            return $text;
        }

        $translated = trim($translated, " \t\n\r\0\x0B\"'\xE2\x80\x9C\xE2\x80\x9D");

        Log::info('Translation successful', [
            'original' => substr($text, 0, 50),
            'translated' => substr($translated, 0, 50),
            'from' => $sourceLang,
            'to' => $targetLang,
        ]);

        Cache::put($cacheKey, $translated, now()->addDays(30));

        return $translated;
    }

    /**
     * Translate an array of strings
     *
     * @param array $texts Array of texts to translate
     * @param string $targetLang Target language code
     * @param string $sourceLang Source language code
     * @return array Translated array
     */
    public function translateArray(array $texts, string $targetLang = 'ar', string $sourceLang = 'en'): array
    {
        if ($targetLang === 'en' || $targetLang === $sourceLang) {
            return $texts;
        }

        $translated = [];
        foreach ($texts as $key => $text) {
            if (is_string($text)) {
                $translated[$key] = $this->translate($text, $targetLang, $sourceLang);
            } else {
                $translated[$key] = $text;
            }
        }

        return $translated;
    }

    /**
     * Recursively translate all string values in a nested array/object
     *
     * @param mixed $data Data to translate
     * @param string $targetLang Target language code
     * @param string $sourceLang Source language code
     * @param array $excludeKeys Keys to exclude from translation
     * @return mixed Translated data
     */
    public function translateDeep($data, string $targetLang = 'ar', string $sourceLang = 'en', array $excludeKeys = []): mixed
    {
        if ($targetLang === 'en' || $targetLang === $sourceLang) {
            return $data;
        }

        if (is_string($data)) {
            return $this->translate($data, $targetLang, $sourceLang);
        }

        if (is_array($data)) {
            $translated = [];
            foreach ($data as $key => $value) {
                // Skip excluded keys (like URLs, IDs, scientific names, etc.)
                if (in_array($key, $excludeKeys)) {
                    $translated[$key] = $value;
                } else {
                    $translated[$key] = $this->translateDeep($value, $targetLang, $sourceLang, $excludeKeys);
                }
            }
            return $translated;
        }

        return $data;
    }

    /**
     * Translate plant data specifically
     * Handles plant identification results with specific fields
     *
     * @param array $plantData Plant data from PlantNet API
     * @param string $targetLang Target language code
     * @return array Translated plant data
     */
    public function translatePlantData(array $plantData, string $targetLang = 'ar'): array
    {
        if ($targetLang === 'en') {
            return $plantData;
        }

        // Keys that should NOT be translated
        $excludeKeys = [
            'scientific_name',  // Scientific names stay in Latin
            'image_url',        // URLs stay unchanged
            'url',
            'perenual_id',      // IDs stay unchanged
            'id',
            'confidence',       // Numbers stay unchanged
            'watering_interval_days',
            'method',           // Technical identifiers
            'raw_data',         // Keep raw data untranslated
            'verified_by',                // Internal audit marker (e.g. "gemini_vision_cross_check")
            'previous_scientific_name',   // Internal audit trail, stays in Latin like scientific_name
            // Plant name fields are resolved (English + Arabic) when the plant is identified.
            // Machine-translating them corrupts the names, so the client picks the right one.
            'name',
            'name_ar',
            'name_en',
            'arabic_name',
            'common_name_resolved',
            'common_names',
        ];

        // Translate the plant data
        $translatedData = $this->translateDeep($plantData, $targetLang, 'en', $excludeKeys);

        Log::info('Plant data translated', [
            'target_lang' => $targetLang,
            'original_name' => $plantData['name'] ?? 'N/A',
            'translated_name' => $translatedData['name'] ?? 'N/A'
        ]);

        return $translatedData;
    }

    /**
     * Clear translation cache
     *
     * @return void
     */
    public function clearCache(): void
    {
        Cache::flush();
        Log::info('Translation cache cleared');
    }
}
