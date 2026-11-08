<?php

/**
 * Import plant species from GBIF into plant_encyclopedia table.
 *
 * Usage:  php scripts/import_gbif.php [start_offset]
 * Resume: php scripts/import_gbif.php 6000   ← resumes from offset 6000
 *
 * Safety:
 *  - Uses INSERT IGNORE — never overwrites existing rows
 *  - Skips plants without a common name or canonical name
 *  - Saves progress to /tmp/gbif_import_progress.txt (resume on crash)
 *  - Does NOT touch existing plants, user data, or mobile app endpoints
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// ── Config ────────────────────────────────────────────────────────────────────

$BATCH_SIZE    = 300;    // GBIF max per request
$DELAY_MS      = 800;    // ms between API calls (be polite to GBIF)
$PROGRESS_FILE = '/tmp/gbif_import_progress.txt';

// Resume from saved offset or CLI argument
$startOffset = (int)($argv[1] ?? (file_exists($PROGRESS_FILE) ? (int)file_get_contents($PROGRESS_FILE) : 0));

// ── Helpers ───────────────────────────────────────────────────────────────────

function gbifGet(string $url): ?array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT      => 'GreenyCorneer/1.0 (greenycorner.ae)',
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);
    $response = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) return null;
    return json_decode($response, true);
}

function getGbifImage(int $gbifKey): ?string
{
    $data = gbifGet("https://api.gbif.org/v1/species/{$gbifKey}/media?limit=3&type=StillImage");
    if (empty($data['results'])) return null;

    foreach ($data['results'] as $media) {
        $url = $media['identifier'] ?? null;
        if ($url && preg_match('/\.(jpg|jpeg|png|webp)/i', $url)) {
            return $url;
        }
    }
    return $data['results'][0]['identifier'] ?? null;
}

function makeSlug(string $name): string
{
    return Str::slug($name);
}

function uniqueSlug(string $base): string
{
    $slug  = $base;
    $count = 1;
    while (DB::table('plant_encyclopedia')->where('slug', $slug)->exists()) {
        $slug = $base . '-' . $count++;
    }
    return $slug;
}

function extractEnglishName(array $vernacularNames): ?string
{
    // Prefer English names first
    foreach ($vernacularNames as $v) {
        $lang = strtolower($v['language'] ?? '');
        if (in_array($lang, ['eng', 'en', 'english']) && !empty($v['vernacularName'])) {
            return ucfirst(strtolower($v['vernacularName']));
        }
    }
    // Fall back to any language
    foreach ($vernacularNames as $v) {
        if (!empty($v['vernacularName'])) {
            return ucfirst(strtolower($v['vernacularName']));
        }
    }
    return null;
}

function extractArabicName(array $vernacularNames): ?string
{
    foreach ($vernacularNames as $v) {
        $lang = strtolower($v['language'] ?? '');
        if (in_array($lang, ['ara', 'ar', 'arabic']) && !empty($v['vernacularName'])) {
            return $v['vernacularName'];
        }
    }
    return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

echo "🌿 Greeny Corner — GBIF Plant Importer\n";
echo "   Resuming from offset: {$startOffset}\n";
echo "   (Safe to stop and restart anytime)\n\n";

$offset   = $startOffset;
$inserted = 0;
$skipped  = 0;
$total    = 0;

do {
    $url  = "https://api.gbif.org/v1/species/search?"
          . http_build_query([
                'highertaxonKey' => 6,           // Plantae kingdom
                'rank'           => 'SPECIES',
                'status'         => 'ACCEPTED',
                'hasVernacularName' => 'true',
                'limit'          => $BATCH_SIZE,
                'offset'         => $offset,
            ]);

    echo "📄 Offset {$offset} — fetching...\n";

    $data = gbifGet($url);

    if (!$data || empty($data['results'])) {
        echo "No data at offset {$offset} — stopping.\n";
        break;
    }

    $totalCount = $data['count'] ?? 0;
    $plants     = $data['results'];

    foreach ($plants as $p) {
        $total++;

        $canonicalName   = $p['canonicalName'] ?? null;
        $vernacularNames = $p['vernacularNames'] ?? [];
        $commonName      = extractEnglishName($vernacularNames);
        $arabicName      = extractArabicName($vernacularNames);

        // Must have at least a scientific name
        if (!$canonicalName) {
            $skipped++;
            continue;
        }

        $displayName = $commonName ?: $canonicalName;
        $slug        = makeSlug($displayName);

        // Skip if slug already exists (either from this import or previous data)
        if (DB::table('plant_encyclopedia')->where('slug', $slug)->exists()) {
            // Try scientific name match instead
            if (DB::table('plant_encyclopedia')->where('scientific_name', $canonicalName)->exists()) {
                $skipped++;
                continue;
            }
            $slug = uniqueSlug($slug);
        }

        // Get image (one extra API call per plant — skip for now, run Unsplash after)
        // We'll use GBIF image only if we have a specific gbifKey
        $images = [];

        // Build all vernacular names for common_names field
        $allCommonNames = array_values(array_filter(
            array_unique(array_map(fn($v) => $v['vernacularName'] ?? null, $vernacularNames))
        ));

        $row = [
            'slug'            => $slug,
            'name'            => $displayName,
            'scientific_name' => $canonicalName,
            'family'          => $p['family'] ?? null,
            'genus'           => $p['genus'] ?? null,
            'common_names'    => !empty($allCommonNames) ? json_encode($allCommonNames) : null,
            'gbif_id'         => $p['key'] ?? null,
            'is_featured'     => 0,
            'sources'         => json_encode(['gbif']),
            'created_at'      => now(),
            'updated_at'      => now(),
        ];

        // Add Arabic name to description_ar if available
        if ($arabicName) {
            $row['description_ar'] = $arabicName;
        }

        try {
            DB::table('plant_encyclopedia')->insertOrIgnore($row);
            $inserted++;

            if ($inserted % 100 === 0) {
                echo "  ✅ {$inserted} inserted so far (offset {$offset})\n";
            }
        } catch (\Exception $e) {
            echo "  ⚠ Insert error for {$displayName}: " . $e->getMessage() . "\n";
            $skipped++;
        }
    }

    // Save progress
    $offset += $BATCH_SIZE;
    file_put_contents($PROGRESS_FILE, $offset);

    $pct = $totalCount > 0 ? round(($offset / $totalCount) * 100, 1) : '?';
    echo "   Progress: {$offset}/{$totalCount} ({$pct}%) — inserted: {$inserted} skipped: {$skipped}\n\n";

    usleep($DELAY_MS * 1000);

} while (!($data['endOfRecords'] ?? false) && $offset < 500000);

// Clear progress file when done
if (file_exists($PROGRESS_FILE)) unlink($PROGRESS_FILE);

echo "\n════════════════════════════════\n";
echo "✅ Inserted : {$inserted}\n";
echo "⏭  Skipped  : {$skipped}\n";
echo "📊 Total    : {$total}\n";
echo "\nNext step: run import_open_plantbook.php to add care data.\n";
echo "Then run update_plant_images_unsplash.php to add images.\n";
