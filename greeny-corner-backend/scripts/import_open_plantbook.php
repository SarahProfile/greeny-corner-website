<?php

/**
 * Enrich plant_encyclopedia with care data from Open Plantbook API.
 *
 * Usage:
 *   1. Register free at https://open.plantbook.io/
 *   2. Get client_id and client_secret from your account
 *   3. Run: php scripts/import_open_plantbook.php CLIENT_ID CLIENT_SECRET
 *
 * What it does:
 *  - Fetches all ~5,000 plants from Open Plantbook
 *  - Matches each to existing rows in plant_encyclopedia by scientific name
 *  - Updates care_info with: watering, light, humidity, temperature, fertilizing, soil
 *  - Does NOT insert new rows — only enriches existing ones
 *  - Safe to re-run (idempotent)
 */

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// ── Config ────────────────────────────────────────────────────────────────────

$clientId     = $argv[1] ?? null;
$clientSecret = $argv[2] ?? null;

if (!$clientId || !$clientSecret) {
    echo "Usage: php scripts/import_open_plantbook.php CLIENT_ID CLIENT_SECRET\n";
    echo "\nGet credentials free at: https://open.plantbook.io/\n";
    exit(1);
}

$BATCH_SIZE = 100;
$DELAY_MS   = 500;

// ── Auth ──────────────────────────────────────────────────────────────────────

function getToken(string $clientId, string $clientSecret): ?string
{
    $ch = curl_init('https://open.plantbook.io/api/v1/token/');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'grant_type'    => 'client_credentials',
            'client_id'     => $clientId,
            'client_secret' => $clientSecret,
        ]),
        CURLOPT_TIMEOUT => 10,
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return $data['access_token'] ?? null;
}

function plantbookGet(string $url, string $token): ?array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HTTPHEADER     => ["Authorization: Bearer {$token}"],
    ]);
    $response = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) return null;
    return json_decode($response, true);
}

function buildCareInfo(array $p): array
{
    return [
        'watering'               => $p['max_light_lux'] ?? null,
        'min_light_lux'          => $p['min_light_lux'] ?? null,
        'max_light_lux'          => $p['max_light_lux'] ?? null,
        'min_light_mmol'         => $p['min_light_mmol'] ?? null,
        'max_light_mmol'         => $p['max_light_mmol'] ?? null,
        'min_temp'               => $p['min_temp'] ?? null,
        'max_temp'               => $p['max_temp'] ?? null,
        'min_env_humid'          => $p['min_env_humid'] ?? null,
        'max_env_humid'          => $p['max_env_humid'] ?? null,
        'min_soil_moist'         => $p['min_soil_moist'] ?? null,
        'max_soil_moist'         => $p['max_soil_moist'] ?? null,
        'min_soil_ec'            => $p['min_soil_ec'] ?? null,
        'max_soil_ec'            => $p['max_soil_ec'] ?? null,
        'watering_interval_days' => $p['watering_interval'] ?? null,
        'light'                  => buildLightLabel($p),
        'difficulty'             => buildDifficultyLabel($p),
        'source'                 => 'open_plantbook',
    ];
}

function buildLightLabel(array $p): string
{
    $lux = $p['min_light_lux'] ?? 0;
    return match(true) {
        $lux >= 10000 => 'Full Sun',
        $lux >= 5000  => 'Bright Indirect',
        $lux >= 1000  => 'Medium Light',
        default        => 'Low Light',
    };
}

function buildDifficultyLabel(array $p): string
{
    $interval = $p['watering_interval'] ?? 7;
    $tempMin  = $p['min_temp'] ?? 10;
    return match(true) {
        $interval <= 3 || $tempMin > 18 => 'Expert',
        $interval >= 14                  => 'Beginner',
        default                          => 'Intermediate',
    };
}

// ── Main ──────────────────────────────────────────────────────────────────────

echo "🌿 Greeny Corner — Open Plantbook Care Data Importer\n\n";

echo "🔐 Getting access token...\n";
$token = getToken($clientId, $clientSecret);

if (!$token) {
    echo "❌ Failed to get token. Check your CLIENT_ID and CLIENT_SECRET.\n";
    exit(1);
}
echo "✅ Token obtained.\n\n";

$offset  = 0;
$updated = 0;
$skipped = 0;

do {
    $url  = "https://open.plantbook.io/api/v1/plant/search/?"
          . http_build_query(['limit' => $BATCH_SIZE, 'offset' => $offset]);

    echo "📄 Fetching offset {$offset}...\n";
    $data = plantbookGet($url, $token);

    if (!$data || empty($data['results'])) {
        echo "No more data.\n";
        break;
    }

    foreach ($data['results'] as $p) {
        $pid    = $p['pid'] ?? null;   // scientific name is the pid
        $alias  = $p['display_pid'] ?? $pid;

        if (!$pid) { $skipped++; continue; }

        // Fetch full detail for this plant
        $detail = plantbookGet(
            "https://open.plantbook.io/api/v1/plant/detail/{$pid}/",
            $token
        );
        usleep(200000); // 200ms between detail calls

        if (!$detail) { $skipped++; continue; }

        $careInfo = buildCareInfo($detail);

        // Match by scientific name (pid is usually scientific name)
        $existing = DB::table('plant_encyclopedia')
            ->where('scientific_name', $pid)
            ->orWhere('scientific_name', $alias)
            ->orWhere('name', 'like', "%{$alias}%")
            ->first();

        if (!$existing) {
            $skipped++;
            continue;
        }

        DB::table('plant_encyclopedia')
            ->where('id', $existing->id)
            ->update([
                'care_info'  => json_encode($careInfo),
                'updated_at' => now(),
            ]);

        echo "  💧 Updated care for: {$alias}\n";
        $updated++;
    }

    $offset += $BATCH_SIZE;
    usleep($DELAY_MS * 1000);

} while (!empty($data['next']));

echo "\n════════════════════════════════\n";
echo "💧 Care data updated: {$updated}\n";
echo "⏭  Not matched: {$skipped}\n";
echo "\nDone! Your plants now have watering intervals, light requirements, and temperature ranges.\n";
