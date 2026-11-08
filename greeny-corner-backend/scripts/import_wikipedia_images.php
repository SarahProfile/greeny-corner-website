<?php

/**
 * Fetch plant images from Wikipedia API (batch mode) — standalone, no Laravel.
 *
 * Queries 50 plant scientific names per API call (Wikipedia batch support).
 * ~50x faster than single-plant queries. Free, no API key.
 *
 * Usage:  php scripts/import_wikipedia_images.php [last_id]
 * Resume: php scripts/import_wikipedia_images.php 50000
 */

set_time_limit(0);
ini_set('memory_limit', '256M');

$DB_HOST = '127.0.0.1';
$DB_NAME = 'u436103792_greenycorner';
$DB_USER = 'u436103792_greenycorner';
$DB_PASS = 'SSHloginpass123!';

try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER, $DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Exception $e) {
    die("DB connection failed: " . $e->getMessage() . "\n");
}

$PROGRESS_FILE = '/tmp/wiki_images_progress.txt';
$CHUNK         = 300;  // rows per DB fetch
$WIKI_BATCH    = 50;   // Wikipedia allows up to 50 titles per request
$DELAY_US      = 250000; // 250ms between Wikipedia API calls

$lastId = (int)($argv[1] ?? (file_exists($PROGRESS_FILE)
    ? (int)file_get_contents($PROGRESS_FILE)
    : 0));

// ── Wikipedia batch image fetcher ─────────────────────────────────────────────

function wikiBatchImages(array $titles): array
{
    // titles => [ 'Rosa canina' => 'https://...' | null, ... ]
    if (empty($titles)) return [];

    $joined = implode('|', array_map(fn($t) => str_replace(' ', '_', $t), $titles));

    $url = 'https://en.wikipedia.org/w/api.php?' . http_build_query([
        'action'      => 'query',
        'titles'      => $joined,
        'prop'        => 'pageimages',
        'format'      => 'json',
        'pithumbsize' => 800,
        'pilicense'   => 'any',
        'redirects'   => 1,
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT      => 'GreenyCorneerBot/1.0 (greenycorner.ae)',
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);
    $response = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) return [];

    $data  = json_decode($response, true);
    $pages = $data['query']['pages'] ?? [];

    $results = [];
    foreach ($pages as $page) {
        if (isset($page['missing']) || empty($page['thumbnail']['source'])) continue;
        $title = $page['title'] ?? '';
        // Upscale thumbnail URL
        $thumb = $page['thumbnail']['source']; // use exact URL from API — don't modify size
        $results[$title] = $thumb;
    }

    // Also map via redirects
    $redirects = $data['query']['redirects'] ?? [];
    foreach ($redirects as $r) {
        if (isset($results[$r['to']])) {
            $results[$r['from']] = $results[$r['to']];
        }
    }

    return $results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

echo "🌿 Greeny Corner — Wikipedia Image Importer (batch mode)\n";
echo "   50 plants per API call — ~50x faster\n";
echo "   Resuming from id > {$lastId}\n\n";

$stmt   = $pdo->prepare("
    SELECT id, name, scientific_name, images FROM plant_encyclopedia
    WHERE id > :last_id
    ORDER BY id ASC
    LIMIT {$CHUNK}
");
$update = $pdo->prepare("UPDATE plant_encyclopedia SET images = ?, updated_at = NOW() WHERE id = ?");

$updated = 0;
$failed  = 0;
$skipped = 0;

while (true) {
    $stmt->execute([':last_id' => $lastId]);
    $plants = $stmt->fetchAll(PDO::FETCH_OBJ);

    if (empty($plants)) {
        echo "\nNo more plants — done!\n";
        break;
    }

    // Split into batches of WIKI_BATCH for Wikipedia
    $chunks = array_chunk($plants, $WIKI_BATCH);

    foreach ($chunks as $batch) {
        // Collect scientific names for plants that need images
        $needsImage = [];
        foreach ($batch as $plant) {
            if (!empty($plant->images) && $plant->images !== '[]' && $plant->images !== '') {
                $skipped++;
                continue;
            }
            if (empty($plant->scientific_name)) {
                $skipped++;
                continue;
            }
            $needsImage[$plant->scientific_name] = $plant;
        }

        if (empty($needsImage)) {
            $lastId = end($batch)->id;
            continue;
        }

        // Batch query Wikipedia by scientific name
        $imageMap = wikiBatchImages(array_keys($needsImage));
        usleep($DELAY_US);

        // Collect plants that got no image — retry by common name
        $retryByName = [];

        foreach ($needsImage as $sciName => $plant) {
            $sciNorm = str_replace('_', ' ', $sciName);
            $imgUrl  = $imageMap[$sciNorm]
                    ?? $imageMap[$sciName]
                    ?? $imageMap[str_replace(' ', '_', $sciName)]
                    ?? null;

            if ($imgUrl) {
                $update->execute([json_encode([$imgUrl]), $plant->id]);
                $updated++;
            } else {
                // Queue for retry by common name if name differs from scientific name
                $commonName = $plant->name;
                if ($commonName && strtolower($commonName) !== strtolower($sciName)) {
                    $retryByName[$commonName] = $plant;
                } else {
                    $failed++;
                }
            }

            $lastId = $plant->id;
        }

        // Retry by common name for plants that had no Wikipedia page under scientific name
        if (!empty($retryByName)) {
            $retryMap = wikiBatchImages(array_keys($retryByName));
            usleep($DELAY_US);
            foreach ($retryByName as $commonName => $plant) {
                $imgUrl = $retryMap[$commonName]
                       ?? $retryMap[str_replace(' ', '_', $commonName)]
                       ?? null;
                if ($imgUrl) {
                    $update->execute([json_encode([$imgUrl]), $plant->id]);
                    $updated++;
                } else {
                    $failed++;
                }
            }
        }
    }

    // lastId from last plant in this chunk
    $lastId = end($plants)->id;
    file_put_contents($PROGRESS_FILE, $lastId);
    echo "  ✅ {$updated} saved | ❌ {$failed} not found | ⏭ {$skipped} skipped | last_id {$lastId}\n";
}

if (file_exists($PROGRESS_FILE)) unlink($PROGRESS_FILE);

echo "\n════════════════════════════════\n";
echo "📸 Images saved  : {$updated}\n";
echo "❌ Not found     : {$failed}\n";
echo "⏭  Skipped       : {$skipped}\n";
