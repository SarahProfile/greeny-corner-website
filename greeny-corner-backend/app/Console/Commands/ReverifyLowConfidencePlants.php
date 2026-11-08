<?php

namespace App\Console\Commands;

use App\Http\Controllers\API\PlantController;
use App\Models\Plant;
use App\Services\PlantNameService;
use Illuminate\Console\Command;
use ReflectionMethod;

class ReverifyLowConfidencePlants extends Command
{
    protected $signature = 'plants:reverify-low-confidence
                            {--dry-run : Only report what would change, do not write}
                            {--limit=0 : Maximum number of plants to process (0 = all)}
                            {--threshold=0.4 : Re-check plants whose original confidence is below this}';

    protected $description = 'Send each low-confidence plant\'s existing photo to a second, independent AI '
        . '(Gemini vision via OpenRouter) and correct the species when the two disagree with reasonable confidence. '
        . 'Guards against acting on another weak guess: only overwrites when the second opinion is itself confident.';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');
        $limit = (int) $this->option('limit');
        $threshold = (float) $this->option('threshold');

        $controller = app(PlantController::class);
        $resolveImagePath = new ReflectionMethod($controller, 'resolveImagePath');
        $resolveImagePath->setAccessible(true);
        $identify = new ReflectionMethod($controller, 'identifyWithGeminiVision');
        $identify->setAccessible(true);

        $plants = Plant::orderBy('id')->get()->filter(function ($p) use ($threshold) {
            $apiData = is_array($p->api_data) ? $p->api_data : [];
            $c = $apiData['confidence'] ?? null;
            return is_numeric($c) && (float) $c < $threshold;
        })->values();

        if ($limit > 0) {
            $plants = $plants->take($limit);
        }

        $this->info(($dry ? '[dry-run] ' : '') . "Re-checking {$plants->count()} low-confidence plants (threshold {$threshold})...");

        $changed = 0;
        $confirmed = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($plants as $plant) {
            $imagePath = $resolveImagePath->invoke($controller, $plant->getRawOriginal('image_url') ?? $plant->image_url);
            if (!$imagePath || !file_exists($imagePath)) {
                $this->warn("#{$plant->id}: image not found on disk, skipping");
                $skipped++;
                continue;
            }

            $result = null;
            try {
                $result = $identify->invoke($controller, $imagePath, 'en');
            } catch (\Throwable $e) {
                $this->warn("#{$plant->id}: second-opinion call failed — " . $e->getMessage());
                $failed++;
                usleep(500000);
                continue;
            }

            if (!$result || empty($result['scientific_name'])) {
                $this->warn("#{$plant->id}: second opinion returned nothing — leaving as-is (still flagged uncertain in the app)");
                $failed++;
                usleep(500000);
                continue;
            }

            $apiData = is_array($plant->api_data) ? $plant->api_data : [];
            $oldSci = $plant->scientific_name ?: ($apiData['scientific_name'] ?? '');
            $newSci = $result['scientific_name'];
            $newName = $result['name'] ?? '';
            $newConfidence = (float) ($result['confidence'] ?? 0);

            // The model sometimes answers with a non-identification ("Unknown" / "Dead plant" /
            // "N/A") rather than a real species, typically for a decayed or unrecognizable
            // subject. That is not an actionable second opinion — applying it would replace a
            // real (if uncertain) name with meaningless placeholder text, which is worse than
            // leaving the plant flagged uncertain. Treat it as "still uncertain" instead.
            $nonAnswers = ['unknown', 'n/a', 'na', 'not sure', 'unsure', 'unidentified', 'unclear',
                'no plant', 'dead plant', 'dead', 'plant', 'houseplant', 'unrecognized', 'none'];
            $isNonAnswer = in_array(strtolower(trim($newSci)), $nonAnswers, true)
                || in_array(strtolower(trim($newName)), $nonAnswers, true);

            if ($isNonAnswer) {
                $this->line("#{$plant->id}: second opinion is a non-answer ('{$newName}' / '{$newSci}') — leaving flagged as uncertain, not overwriting with it");
                $skipped++;
                usleep(700000);
                continue;
            }

            // Compare genus only: same genus but a different named variety is not the
            // "entirely wrong species" bug this is fixing (e.g. pothos vs philodendron IS
            // a genus mismatch and worth fixing; "Monstera deliciosa" vs "Monstera adansonii"
            // is not something a second photo-only AI call can safely arbitrate).
            if (PlantNameService::sameGenus($oldSci, $newSci)) {
                $this->line("#{$plant->id}: second opinion agrees (genus '" . strtolower(trim(explode(' ', trim($newSci))[0] ?? '')) . "') — marking verified");
                if (!$dry) {
                    $apiData['verified_by'] = 'gemini_vision_cross_check';
                    // Cross-checked by an independent model now: no longer show the
                    // "uncertain identification" warning for this plant.
                    $apiData['confidence'] = max((float) ($apiData['confidence'] ?? 0), 0.6);
                    $plant->update(['api_data' => $apiData]);
                }
                $confirmed++;
            } elseif ($newConfidence >= 0.5) {
                $this->line("#{$plant->id}: DISAGREES — was '{$oldSci}' -> now '{$newSci}' ({$result['name']}, confidence {$newConfidence})");
                if (!$dry) {
                    $newApiData = array_merge($apiData, [
                        'name' => $result['name'],
                        'name_en' => $result['name_en'] ?? $result['name'],
                        'name_ar' => $result['name_ar'] ?? ($apiData['name_ar'] ?? null),
                        'scientific_name' => $newSci,
                        'confidence' => $newConfidence,
                        'description' => $result['description'] ?? ($apiData['description'] ?? null),
                        'raw_data' => $result['raw_data'] ?? ($apiData['raw_data'] ?? null),
                        'verified_by' => 'gemini_vision_cross_check',
                        'previous_scientific_name' => $oldSci,
                    ]);
                    $plant->update([
                        'name' => $result['name'],
                        'scientific_name' => $newSci,
                        'api_data' => $newApiData,
                        // Cached AI content (care tips, diseases, meaning, etc.) was generated
                        // for the WRONG species — clear it so it regenerates correctly.
                        'plant_data_en' => null,
                        'plant_data_ar' => null,
                        'diseases_info' => null,
                        'nutrition_info' => null,
                        'fertilizer_info' => null,
                        'meaning_info' => null,
                        'gemini_data_fetched' => false,
                        'gemini_fetched_at' => null,
                    ]);
                }
                $changed++;
            } else {
                $this->line("#{$plant->id}: second opinion is ALSO uncertain (confidence {$newConfidence}) — leaving flagged as uncertain, not guessing further");
                $skipped++;
            }

            // Pace requests: dozens of calls in a row risk tripping OpenRouter rate limits.
            usleep(700000);
        }

        $this->info(($dry ? '[dry-run] ' : '')
            . "Done. Corrected: {$changed}; Confirmed correct (verified): {$confirmed}; Left uncertain: {$skipped}; Failed: {$failed}");

        return self::SUCCESS;
    }
}
