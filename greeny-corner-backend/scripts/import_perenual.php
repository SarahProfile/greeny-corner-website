<?php

/**
 * Import plants from Perenual API into plant_encyclopedia table.
 *
 * Usage: php scripts/import_perenual.php YOUR_PERENUAL_API_KEY [start_page]
 *
 * - Fetches all plants from Perenual (up to 10,000+)
 * - Updates existing plants (matched by scientific name or slug)
 * - Inserts new plants not yet in the database
 * - Saves care info, images, descriptions, toxicity, difficulty
 * - Safe to re-run — uses upsert logic
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// ── Config ────────────────────────────────────────────────────────────────────

$apiKey    = $argv[1] ?? null;
$startPage = (int)($argv[2] ?? 1);

if (!$apiKey) {
    echo "Usage: php scripts/import_perenual.php YOUR_PERENUAL_API_KEY [start_page]\n";
    exit(1);
}

$DELAY_MS   = 300;   // ms between requests
$PER_PAGE   = 30;    // Perenual max per page

// ── Helpers ───────────────────────────────────────────────────────────────────

function perenualGet(string $endpoint, array $params, string $apiKey): ?array
{
    $params['key'] = $apiKey;
    $url = "https://perenual.com/api/{$endpoint}?" . http_build_query($params);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        echo "  ⚠ API error {$httpCode}: {$url}\n";
        return null;
    }

    return json_decode($response, true);
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

function difficultyLabel(?array $watering): ?string
{
    if (!$watering) return null;
    $w = strtolower($watering[0] ?? '');
    return match(true) {
        str_contains($w, 'minimum') || str_contains($w, 'none') => 'Expert',
        str_contains($w, 'frequent')                            => 'Beginner',
        default                                                  => 'Intermediate',
    };
}

function buildCareInfo(array $p): array
{
    return [
        'watering'             => $p['watering'] ?? null,
        'watering_period'      => $p['watering_period'] ?? null,
        'watering_general_benchmark' => $p['watering_general_benchmark'] ?? null,
        'sunlight'             => $p['sunlight'] ?? [],
        'pruning_month'        => $p['pruning_month'] ?? [],
        'pruning_count'        => $p['pruning_count'] ?? null,
        'seeds'                => $p['seeds'] ?? null,
        'attracts'             => $p['attracts'] ?? [],
        'propagation'          => $p['propagation'] ?? [],
        'hardiness'            => $p['hardiness'] ?? null,
        'hardiness_location'   => $p['hardiness_location'] ?? null,
        'flowers'              => $p['flowers'] ?? null,
        'flowering_season'     => $p['flowering_season'] ?? null,
        'flower_color'         => $p['flower_color'] ?? null,
        'cones'                => $p['cones'] ?? null,
        'fruits'               => $p['fruits'] ?? null,
        'edible_fruit'         => $p['edible_fruit'] ?? null,
        'fruit_color'          => $p['fruit_color'] ?? [],
        'harvest_season'       => $p['harvest_season'] ?? null,
        'leaf'                 => $p['leaf'] ?? null,
        'leaf_color'           => $p['leaf_color'] ?? [],
        'edible_leaf'          => $p['edible_leaf'] ?? null,
        'growth_rate'          => $p['growth_rate'] ?? null,
        'maintenance'          => $p['maintenance'] ?? null,
        'care_level'           => $p['care_level'] ?? difficultyLabel($p['watering'] ?? null),
        'soil'                 => $p['soil'] ?? [],
        'drought_tolerant'     => $p['drought_tolerant'] ?? null,
        'salt_tolerant'        => $p['salt_tolerant'] ?? null,
        'thorny'               => $p['thorny'] ?? null,
        'invasive'             => $p['invasive'] ?? null,
        'tropical'             => $p['tropical'] ?? null,
        'indoor'               => $p['indoor'] ?? null,
        'care_guides'          => $p['care_guides'] ?? null,
        'difficulty'           => $p['care_level'] ?? null,
        'light'                => !empty($p['sunlight']) ? implode(', ', (array)$p['sunlight']) : null,
        'watering_interval_days' => null,
    ];
}

function buildGrowthInfo(array $p): array
{
    return [
        'type'            => $p['type'] ?? null,
        'cycle'           => $p['cycle'] ?? null,
        'dimension'       => $p['dimension'] ?? null,
        'dimensions'      => $p['dimensions'] ?? null,
        'volume_water_requirement' => $p['volume_water_requirement'] ?? null,
        'depth_water_requirement'  => $p['depth_water_requirement'] ?? null,
        'average_height'  => $p['average_height'] ?? null,
        'maximum_height'  => $p['maximum_height'] ?? null,
        'plant_anatomy'   => $p['plant_anatomy'] ?? [],
    ];
}

function extractImages(array $p): array
{
    $images = [];
    if (!empty($p['default_image'])) {
        $img = $p['default_image'];
        foreach (['regular_url', 'medium_url', 'small_url', 'original_url', 'thumbnail'] as $key) {
            if (!empty($img[$key])) {
                $images[] = $img[$key];
                break;
            }
        }
    }
    return $images;
}

// ── Main ──────────────────────────────────────────────────────────────────────

echo "🌿 Greeny Corner — Perenual Importer\n";
echo "   Starting from page: {$startPage}\n\n";

$page    = $startPage;
$total   = 0;
$inserted = 0;
$updated  = 0;
$skipped  = 0;

do {
    echo "📄 Fetching page {$page}...\n";

    $data = perenualGet('species-list', ['page' => $page, 'per_page' => $PER_PAGE], $apiKey);

    if (!$data || empty($data['data'])) {
        echo "No more data at page {$page}.\n";
        break;
    }

    $lastPage = $data['last_page'] ?? $page;
    $plants   = $data['data'];

    echo "   Got " . count($plants) . " plants (page {$page}/{$lastPage})\n";

    foreach ($plants as $p) {
        $total++;

        $commonName     = $p['common_name'] ?? null;
        $scientificList = $p['scientific_name'] ?? [];
        $scientificName = is_array($scientificList) ? ($scientificList[0] ?? null) : $scientificList;
        $displayName    = $commonName ?: $scientificName ?: 'Unknown Plant';

        if (!$displayName || $displayName === 'Unknown Plant') {
            $skipped++;
            continue;
        }

        $images    = extractImages($p);
        $careInfo  = buildCareInfo($p);
        $growthInfo = buildGrowthInfo($p);

        $toxicity = null;
        if (isset($p['poisonous_to_humans']) || isset($p['poisonous_to_pets'])) {
            $parts = [];
            if (!empty($p['poisonous_to_humans'])) $parts[] = 'toxic to humans';
            if (!empty($p['poisonous_to_pets']))   $parts[] = 'toxic to pets';
            $toxicity = empty($parts) ? 'Non-toxic' : 'Toxic (' . implode(', ', $parts) . ')';
        }

        $otherNames = array_merge(
            (array)($p['other_name'] ?? []),
            array_slice((array)$scientificList, 1)
        );

        $row = [
            'name'            => ucfirst($displayName),
            'scientific_name' => $scientificName,
            'family'          => $p['family'] ?? null,
            'care_info'       => json_encode($careInfo),
            'growth_info'     => json_encode($growthInfo),
            'toxicity'        => $toxicity,
            'common_names'    => !empty($otherNames) ? json_encode($otherNames) : null,
            'images'          => !empty($images) ? json_encode($images) : null,
            'perenual_id'     => $p['id'] ?? null,
            'sources'         => json_encode(['perenual']),
            'updated_at'      => now(),
        ];

        // Try to match existing record
        $existing = null;
        if ($scientificName) {
            $existing = DB::table('plant_encyclopedia')
                ->where('scientific_name', $scientificName)
                ->first();
        }
        if (!$existing && $commonName) {
            $existing = DB::table('plant_encyclopedia')
                ->where('name', ucfirst($commonName))
                ->first();
        }
        if (!$existing && isset($p['id'])) {
            $existing = DB::table('plant_encyclopedia')
                ->where('perenual_id', $p['id'])
                ->first();
        }

        if ($existing) {
            // Update — keep existing description/images if Perenual has none
            if (empty($row['images']) && !empty($existing->images)) {
                unset($row['images']);
            }
            DB::table('plant_encyclopedia')
                ->where('id', $existing->id)
                ->update($row);
            echo "  ↺  Updated: {$displayName}\n";
            $updated++;
        } else {
            // Insert new
            $slug = uniqueSlug(makeSlug($displayName));
            $row['slug']       = $slug;
            $row['created_at'] = now();
            DB::table('plant_encyclopedia')->insert($row);
            echo "  +  Inserted: {$displayName} [{$slug}]\n";
            $inserted++;
        }

        usleep($DELAY_MS * 1000);
    }

    $page++;

} while ($page <= $lastPage);

echo "\n────────────────────────────────\n";
echo "✅ Inserted : {$inserted}\n";
echo "↺  Updated  : {$updated}\n";
echo "⏭  Skipped  : {$skipped}\n";
echo "📊 Total    : {$total}\n";
echo "\nDone! Run the Unsplash image script next to fill missing photos.\n";
