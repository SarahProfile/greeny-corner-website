<?php

/**
 * Update plant encyclopedia images from Unsplash.
 *
 * Usage: php scripts/update_plant_images_unsplash.php YOUR_UNSPLASH_ACCESS_KEY
 *
 * - Searches Unsplash for each plant by scientific name, then common name
 * - Prefers photos tagged "potted plant" / "houseplant" for indoor plants
 * - Updates the image column in plant_encyclopedia table
 * - Skips plants that already have a good image (non-Wikipedia)
 * - Rate-limited to 50 requests/hour (Unsplash demo limit)
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// ── Config ────────────────────────────────────────────────────────────────────

$accessKey = $argv[1] ?? null;

if (!$accessKey) {
    echo "Usage: php scripts/update_plant_images_unsplash.php YOUR_UNSPLASH_ACCESS_KEY\n";
    exit(1);
}

$OVERWRITE_WIKIPEDIA = true;   // replace old Wikipedia URLs
$OVERWRITE_ALL       = false;  // set true to replace every image, including good ones
$DRY_RUN             = false;  // set true to preview without saving
$DELAY_MS            = 1200;   // ms between requests (stay under 50/hour = 1 per 72s, but demo allows bursts)

// Search queries per plant — tries each in order, picks first good result
function buildQueries(string $name, ?string $scientificName): array
{
    $queries = [];

    if ($scientificName && $scientificName !== $name) {
        $queries[] = $scientificName . ' potted plant';
        $queries[] = $scientificName . ' houseplant';
        $queries[] = $scientificName;
    }

    $queries[] = $name . ' potted plant indoors';
    $queries[] = $name . ' houseplant pot';
    $queries[] = $name . ' plant';

    return array_unique($queries);
}

function searchUnsplash(string $query, string $accessKey): ?string
{
    $url = 'https://api.unsplash.com/search/photos?' . http_build_query([
        'query'       => $query,
        'per_page'    => 5,
        'orientation' => 'squarish',
        'content_filter' => 'high',
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            "Authorization: Client-ID {$accessKey}",
            "Accept-Version: v1",
        ],
        CURLOPT_TIMEOUT => 10,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        echo "  ⚠ Unsplash API error {$httpCode} for query: {$query}\n";
        return null;
    }

    $data = json_decode($response, true);
    $results = $data['results'] ?? [];

    if (empty($results)) {
        return null;
    }

    // Pick the photo with the most likes (best quality signal)
    usort($results, fn($a, $b) => $b['likes'] - $a['likes']);

    // Return the "regular" size URL (1080px wide — good for web)
    return $results[0]['urls']['regular'] ?? $results[0]['urls']['full'] ?? null;
}

function getFirstImage(?string $imagesJson): ?string
{
    if (empty($imagesJson)) return null;
    $arr = json_decode($imagesJson, true);
    return (!empty($arr) && is_array($arr)) ? $arr[0] : null;
}

function isWikipediaUrl(?string $url): bool
{
    return $url && str_contains($url, 'wikimedia.org');
}

function isMissingOrBad(?string $url): bool
{
    return empty($url) || isWikipediaUrl($url);
}

// ── Main ──────────────────────────────────────────────────────────────────────

$plants = DB::table('plant_encyclopedia')->get();
$total  = $plants->count();

echo "🌿 Greeny Corner — Unsplash Image Updater\n";
echo "   Plants to process: {$total}\n";
echo "   Dry run: " . ($DRY_RUN ? 'YES' : 'NO') . "\n\n";

$updated = 0;
$skipped = 0;
$failed  = 0;

foreach ($plants as $index => $plant) {
    $num = $index + 1;
    echo "[{$num}/{$total}] {$plant->name}";

    $currentImage = getFirstImage($plant->images);

    // Decide whether to update
    if (!$OVERWRITE_ALL) {
        if (!$OVERWRITE_WIKIPEDIA && !isMissingOrBad($currentImage)) {
            echo " → SKIP (has image)\n";
            $skipped++;
            continue;
        }
        if ($OVERWRITE_WIKIPEDIA && !isMissingOrBad($currentImage)) {
            echo " → SKIP (already has good image)\n";
            $skipped++;
            continue;
        }
    }

    $queries   = buildQueries($plant->name, $plant->scientific_name);
    $imageUrl  = null;

    foreach ($queries as $query) {
        echo "\n  🔍 Searching: \"{$query}\"";
        $imageUrl = searchUnsplash($query, $accessKey);
        usleep($DELAY_MS * 1000);

        if ($imageUrl) {
            echo " ✓";
            break;
        }
    }

    if (!$imageUrl) {
        echo "\n  ✗ No image found — keeping existing\n";
        $failed++;
        continue;
    }

    echo "\n  📸 " . substr($imageUrl, 0, 80) . "...\n";

    if (!$DRY_RUN) {
        DB::table('plant_encyclopedia')
            ->where('id', $plant->id)
            ->update(['images' => json_encode([$imageUrl]), 'updated_at' => now()]);
        $updated++;
    }
}

echo "\n────────────────────────────────\n";
echo "✅ Updated : {$updated}\n";
echo "⏭  Skipped : {$skipped}\n";
echo "❌ Not found: {$failed}\n";
echo $DRY_RUN ? "\n(Dry run — no changes saved)\n" : "\nDone!\n";
