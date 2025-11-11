<?php

namespace App\Services;

use Stichoza\GoogleTranslate\GoogleTranslate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class TranslationService
{
    private $translator;

    /**
     * Create a new TranslationService instance.
     */
    public function __construct()
    {
        // Initialize Google Translate
        // The package will be installed via: composer require stichoza/google-translate-php
        if (class_exists(GoogleTranslate::class)) {
            $this->translator = new GoogleTranslate('ar'); // Default target: Arabic
        }
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

        // If translator is not available (package not installed yet), return original text
        if (!$this->translator) {
            Log::warning('Google Translate package not installed. Returning original text.');
            return $text;
        }

        // Create a cache key based on text and languages
        $cacheKey = 'translation_' . md5($text . $sourceLang . $targetLang);

        try {
            // Try to get from cache first (cache for 30 days)
            return Cache::remember($cacheKey, 60 * 60 * 24 * 30, function () use ($text, $targetLang, $sourceLang) {
                $this->translator->setSource($sourceLang);
                $this->translator->setTarget($targetLang);

                $translated = $this->translator->translate($text);

                Log::info('Translation successful', [
                    'original' => substr($text, 0, 50),
                    'translated' => substr($translated, 0, 50),
                    'from' => $sourceLang,
                    'to' => $targetLang
                ]);

                return $translated;
            });
        } catch (\Exception $e) {
            Log::error('Translation failed: ' . $e->getMessage(), [
                'text' => substr($text, 0, 50),
                'from' => $sourceLang,
                'to' => $targetLang
            ]);

            // Return original text if translation fails
            return $text;
        }
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
