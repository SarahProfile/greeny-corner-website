<?php

namespace App\Services;

use App\Models\Plant;
use App\Models\PlantEncyclopedia;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Resolves the COMMON name of a plant in English and Arabic.
 *
 * Plants must always be shown by their common name ("Fiddle Leaf Fig" /
 * "تين كمان"), never by the Latin name ("Ficus lyrata"). PlantNet often returns
 * no common name, so we resolve it here: local encyclopedia first, then AI.
 *
 * Note on the AI calls (via OpenRouter): the model's internal "thinking" tokens count
 * against max_tokens, so a tiny limit (e.g. 32) frequently returns an EMPTY answer.
 * The limit is generous.
 */
class PlantNameService
{
    private const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

    public static function hasArabic(?string $text): bool
    {
        return $text !== null && $text !== '' && (bool) preg_match('/\p{Arabic}/u', $text);
    }

    /**
     * True when two scientific names share a genus (first word), case-insensitively.
     * Used to cross-check two independent identifications of the same photo: same genus
     * is treated as agreement even if the species/variety differs, since that's not the
     * "entirely wrong plant" failure mode this guards against.
     */
    public static function sameGenus(?string $a, ?string $b): bool
    {
        $genusA = mb_strtolower(trim(explode(' ', trim((string) $a))[0] ?? ''));
        $genusB = mb_strtolower(trim(explode(' ', trim((string) $b))[0] ?? ''));
        return $genusA !== '' && $genusA === $genusB;
    }

    /**
     * True when $name is just the plant's Latin/scientific name.
     */
    public static function isScientific(?string $name, ?string $scientificName): bool
    {
        $name = mb_strtolower(trim((string) $name));
        $sci = mb_strtolower(trim((string) $scientificName));
        if ($name === '' || $sci === '' || self::hasArabic($name)) {
            return false;
        }
        // Exact match or cultivar suffix; a genus-only name ("Monstera") is a legitimate common name
        return $name === $sci || str_starts_with($name, $sci . ' ');
    }

    /**
     * @return array{en: ?string, ar: ?string}
     */
    public function resolve(string $scientificName): array
    {
        $sci = trim($scientificName);
        if ($sci === '') {
            return ['en' => null, 'ar' => null];
        }

        // v2: v1 entries were built from encyclopedia data with junk English/Arabic names
        $cacheKey = 'plant_names_v2_' . md5(mb_strtolower($sci));
        $cached = Cache::get($cacheKey);
        if (is_array($cached) && (!empty($cached['en']) || !empty($cached['ar']))) {
            return $cached + ['en' => null, 'ar' => null];
        }

        // AI first: the encyclopedia's names are scraped / machine-translated and are often
        // multi-name strings, other languages or wrong Arabic. It is only a fallback for English.
        $names = $this->fromAi($sci);

        // The AI sometimes confuses look-alike species ("Lepechinia meyenii" -> "Maca", which is
        // Lepidium meyenii). A wrong common name is worse than the Latin one, so drop it.
        if (!empty($names['en']) && $this->belongsToOtherSpecies($names['en'], $sci)) {
            Log::info("PlantNameService: rejected '{$names['en']}' for {$sci} (name belongs to another species)");
            $names['en'] = null;
        }

        if (empty($names['en'])) {
            $fallback = $this->englishFromEncyclopedia($sci);
            if ($fallback && !$this->belongsToOtherSpecies($fallback, $sci)) {
                $names['en'] = $fallback;
            }
        }

        if (!empty($names['en']) || !empty($names['ar'])) {
            Cache::put($cacheKey, $names, now()->addDays(30));
        }

        return $names;
    }

    /**
     * Arabic common name for an English common name (or scientific name).
     */
    public function arabicFor(string $englishName): ?string
    {
        $englishName = trim($englishName);
        if ($englishName === '' || self::hasArabic($englishName)) {
            return $englishName !== '' ? $englishName : null;
        }

        $cacheKey = 'plant_name_ar_v1_' . md5(mb_strtolower($englishName));
        if ($cached = Cache::get($cacheKey)) {
            return $cached;
        }

        $text = $this->askAi(
            "What is the most widely used Arabic common name for the plant \"{$englishName}\"? " .
            'Reply with ONLY the Arabic name (Arabic letters only, no transliteration, no explanation).'
        );
        $ar = $this->cleanArabic($text);
        if ($ar) {
            Cache::put($cacheKey, $ar, now()->addDays(30));
        }
        return $ar;
    }

    /**
     * English common name for an Arabic plant name.
     */
    public function englishFor(string $arabicName): ?string
    {
        $arabicName = trim($arabicName);
        if ($arabicName === '' || !self::hasArabic($arabicName)) {
            return null;
        }

        $cacheKey = 'plant_name_en_v1_' . md5($arabicName);
        if ($cached = Cache::get($cacheKey)) {
            return $cached;
        }

        $text = $this->askAi(
            "What is the English common name for the plant known in Arabic as \"{$arabicName}\"? " .
            'Reply with ONLY the English common name, nothing else.'
        );
        $en = $this->cleanEnglish($text);
        if ($en) {
            Cache::put($cacheKey, $en, now()->addDays(30));
        }
        return $en;
    }

    /**
     * Make sure plant.name / api_data.name are the English COMMON name and api_data.name_ar
     * is the Arabic common name. Fixes plants saved with the scientific name (PlantNet had no
     * common name) or with an Arabic name in the English `name` field.
     *
     * @return bool true when an AI lookup was attempted (used to budget list requests)
     */
    public function fixPlant(Plant $plant, bool $allowAi = true, bool $throttle = true): bool
    {
        $apiData = is_array($plant->api_data) ? $plant->api_data : [];
        $name = trim((string) $plant->name);
        $sci = trim((string) ($plant->scientific_name ?: ($apiData['scientific_name'] ?? '')));

        $nameIsScientific = PlantNameService::isScientific($name, $sci);
        $nameIsArabic = PlantNameService::hasArabic($name);
        $needsEnglish = $nameIsScientific || $nameIsArabic;
        $needsArabic = !PlantNameService::hasArabic($apiData['name_ar'] ?? null);

        if (!$needsEnglish && !$needsArabic) {
            return false;
        }
        if (!$allowAi) {
            return false;
        }

        // Don't hammer the AI for the same plant on every request when it can't help
        if ($throttle) {
            $attemptKey = 'plant_name_fix_' . $plant->id . '_' . md5($name . '|' . ($apiData['name_ar'] ?? ''));
            if (Cache::has($attemptKey)) {
                return false;
            }
            Cache::put($attemptKey, 1, now()->addHours(6));
        }

        $names = $this;
        $changed = false;

        if ($needsEnglish) {
            $resolved = $sci !== '' ? $names->resolve($sci) : ['en' => null, 'ar' => null];
            $english = $resolved['en'] ?? null;
            if (!$english && $nameIsArabic) {
                $english = $names->englishFor($name);
            }

            if ($english && !PlantNameService::hasArabic($english) && mb_strtolower($english) !== mb_strtolower($name)) {
                if ($nameIsArabic && !PlantNameService::hasArabic($apiData['name_ar'] ?? null)) {
                    $apiData['name_ar'] = $name; // the stored Arabic name is the Arabic common name
                    $needsArabic = false;
                }
                $plant->name = $english;
                $apiData['name'] = $english;
                $apiData['name_en'] = $english;
                $apiData['common_name_resolved'] = $english;
                $changed = true;
                Log::info("Fixed plant name '{$name}' -> '{$english}' for plant ID {$plant->id}");
            }

            if ($needsArabic && !empty($resolved['ar'])) {
                $apiData['name_ar'] = $resolved['ar'];
                $needsArabic = false;
                $changed = true;
            }
        }

        if ($needsArabic) {
            $ar = $names->arabicFor((string) ($apiData['name'] ?? $plant->name));
            if ($ar) {
                $apiData['name_ar'] = $ar;
                $changed = true;
            }
        }

        if ($changed) {
            $plant->api_data = $apiData;
            $plant->save();
        }

        return true;
    }

    /**
     * True when $commonName is already the name of a DIFFERENT genus with the same species epithet
     * in the encyclopedia (the classic look-alike mix-up). Genus synonyms also trigger this, which
     * is fine: the failure mode is keeping the Latin name.
     */
    private function belongsToOtherSpecies(string $commonName, string $scientificName): bool
    {
        $parts = preg_split('/\s+/', mb_strtolower(trim($scientificName)));
        $genus = $parts[0] ?? '';
        $epithet = $parts[1] ?? '';
        if ($genus === '' || $epithet === '') {
            return false;
        }

        try {
            $needle = mb_strtolower(trim($commonName));
            $rows = PlantEncyclopedia::whereRaw('LOWER(name) = ?', [$needle])
                ->orWhereRaw('LOWER(CAST(common_names AS CHAR)) LIKE ?', ['%"' . $needle . '"%'])
                ->get(['scientific_name']);

            foreach ($rows as $row) {
                $other = preg_split('/\s+/', mb_strtolower(trim((string) $row->scientific_name)));
                if (($other[0] ?? '') !== $genus && ($other[1] ?? '') === $epithet) {
                    return true;
                }
            }
        } catch (\Throwable $e) {
            // encyclopedia table not available: nothing to compare with
        }
        return false;
    }

    /**
     * English common name from the encyclopedia, or null. Only names that pass cleanEnglish()
     * (single name, plain Latin letters) are used; its Arabic names are deliberately ignored.
     */
    private function englishFromEncyclopedia(string $scientificName): ?string
    {
        try {
            $lower = mb_strtolower($scientificName);
            $row = PlantEncyclopedia::whereRaw('LOWER(scientific_name) = ?', [$lower])->first();
            if (!$row) {
                return null;
            }

            foreach (array_merge([$row->name], (array) ($row->common_names ?? [])) as $candidate) {
                $clean = is_string($candidate) ? $this->cleanEnglish($candidate) : null;
                if ($clean && !self::isScientific($clean, $scientificName)) {
                    return $clean;
                }
            }
        } catch (\Throwable $e) {
            // Table may not exist on this environment
        }
        return null;
    }

    private function fromAi(string $scientificName): array
    {
        $text = $this->askAi(
            "Give the most widely used common name of the plant with scientific name \"{$scientificName}\" " .
            'in English and in Arabic. Reply with ONLY valid JSON: {"en":"English common name","ar":"الاسم الشائع بالعربية"}. ' .
            'Only give a common name that you are CERTAIN is widely used for exactly this species. ' .
            'If you are not certain, or the species has no established English common name, set "en" to the scientific name itself. ' .
            'Never guess, and never use the common name of a different species (e.g. do not confuse similar-sounding genera).'
        );
        if (!$text) {
            return ['en' => null, 'ar' => null];
        }

        $text = preg_replace('/```json|```/i', '', $text);
        $data = json_decode(trim($text), true);
        if (!is_array($data) && preg_match('/\{[\s\S]*\}/u', $text, $m)) {
            $data = json_decode($m[0], true);
        }
        if (!is_array($data)) {
            return ['en' => null, 'ar' => null];
        }

        $en = $this->cleanEnglish($data['en'] ?? null);
        if ($en && self::isScientific($en, $scientificName)) {
            $en = null;
        }
        return ['en' => $en, 'ar' => $this->cleanArabic($data['ar'] ?? null)];
    }

    private function cleanEnglish($text): ?string
    {
        if (!is_string($text)) {
            return null;
        }
        // Encyclopedia / AI values are sometimes "Pothos, Scindapsus Doré, ..." or "Name (Other)": keep the first
        $text = trim(preg_split('/[,;\/(]/u', $text)[0] ?? '');
        $text = trim($text, " \t\n\r\0\x0B\"'.");
        if ($text === '' || mb_strlen($text) > 40 || preg_match('/^(null|none|n\/a)$/i', $text)) {
            return null;
        }
        // Plain English-looking name: ASCII letters, spaces, hyphens, apostrophes. This rejects
        // other scripts (Khmer, Arabic...) and accented foreign names (Swedish "Vågbladskalatea").
        if (!preg_match("/^[A-Za-z][A-Za-z' \-]*$/", $text)) {
            return null;
        }
        // "fiddle leaf fig" -> "Fiddle Leaf Fig"; hyphenated words keep their case ("Bird-of-paradise")
        return ucwords(mb_strtolower($text), ' ');
    }

    private function cleanArabic($text): ?string
    {
        if (!is_string($text)) {
            return null;
        }
        $text = trim(trim($text), " \t\n\r\0\x0B\"'.");
        if ($text === '' || mb_strlen($text) > 100 || !self::hasArabic($text)) {
            return null;
        }
        return $text;
    }

    /**
     * Single short text completion through OpenRouter (no direct Google/Gemini key involved).
     */
    private function askAi(string $prompt): ?string
    {
        $openRouterKey = env('OPENROUTER_API_KEY');
        if ($openRouterKey) {
            try {
                $response = Http::timeout(20)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $openRouterKey,
                        'HTTP-Referer' => 'https://greenycorner.ae',
                        'X-Title' => 'Greeny Corner',
                    ])
                    ->post(self::OPENROUTER_URL, [
                        'model' => 'google/gemini-2.5-flash',
                        'messages' => [['role' => 'user', 'content' => $prompt]],
                        // generous: reasoning tokens count toward this limit
                        'max_tokens' => 1000,
                        'temperature' => 0.1,
                    ]);
                if ($response->successful()) {
                    $text = trim((string) $response->json('choices.0.message.content'));
                    if ($text !== '') {
                        return $text;
                    }
                } else {
                    Log::warning('PlantNameService OpenRouter HTTP ' . $response->status());
                }
            } catch (\Throwable $e) {
                Log::warning('PlantNameService OpenRouter failed: ' . $e->getMessage());
            }
        }

        return null;
    }
}
