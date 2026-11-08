<?php

/**
 * Fetch plant images from GBIF media API — standalone, no Laravel needed.
 *
 * Uses ID-based pagination (300 rows at a time) to avoid loading 442K rows into memory.
 * Free, no API key. 300ms delay per request to stay polite.
 *
 * Usage:  php scripts/import_gbif_images.php [last_id]
 * Resume: php scripts/import_gbif_images.php 50000
 */

set_time_limit(0);
ini_set('memory_limit', '256M');

$DB_HOST = '127.0.0.1';
$DB_NAME = 'u436103792_greenycorner';
$DB_USER = 'u436103792_greenycorner';
$DB_PASS = 'SSHloginpass123!';

$pdo = new PDO(
    "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
    $DB_USER, $DB_PASS,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$PROGRESS_FILE = '/tmp/gbif_images_progress.txt';
$CHUNK         = 300;    // rows per DB fetch
$DELAY_US      = 300000; // 300ms between GBIF API calls

$lastId = (int)($argv[1] ?? (file_exists($PROGRESS_FILE)
    ? (int)file_get_contents($PROGRESS_FILE)
    : 0));

// ── GBIF media fetch ──────────────────────────────────────────────────────────

function gbifMediaGet(int $gbifId): ?string
{
    $url = "https://api.gbif.org/v1/species/{$gbifId}/media?limit=5&type=StillImage";
    $ch  = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT      => 'GreenyCorneer/1.0 (greenycorner.ae)',
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);
    $response = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) return null;
    $data = json_decode($response, true);
    if (empty($data['results'])) return null;

    // Prefer iNaturalist or Wikimedia — skip SVG/tif
    foreach ($data['results'] as $media) {
        $u = $media['identifier'] ?? null;
        if (!$u || preg_match('/\.(svg|tif|tiff|bmp)$/i', $u)) continue;
        if (str_contains($u, 'inaturalist') || str_contains($u, 'wikimedia') || str_contains($u, 'upload.wikimedia')) {
            return $u;
        }
    }
    // Fall back to any usable image
    foreach ($data['results'] as $media) {
        $u = $media['identifier'] ?? null;
        if ($u && !preg_match('/\.(svg|tif|tiff|bmp)$/i', $u)) return $u;
    }
    return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

echo "🌿 Greeny Corner — GBIF Image Importer (chunked)\n";
echo "   300 rows per DB fetch — no memory issues\n";
echo "   Resuming from id > {$lastId}\n\n";

$stmt   = $pdo->prepare("
    SELECT id, name, gbif_id FROM plant_encyclopedia
    WHERE id > :last_id
      AND gbif_id IS NOT NULL
      AND (images IS NULL OR images = '[]' OR images = '')
    ORDER BY id ASC
    LIMIT {$CHUNK}
");
$update = $pdo->prepare("UPDATE plant_encyclopedia SET images = ?, updated_at = NOW() WHERE id = ?");

$updated = 0;
$failed  = 0;

while (true) {
    $stmt->execute([':last_id' => $lastId]);
    $plants = $stmt->fetchAll(PDO::FETCH_OBJ);

    if (empty($plants)) {
        echo "\nNo more plants — done!\n";
        break;
    }

    foreach ($plants as $plant) {
        $imageUrl = gbifMediaGet((int)$plant->gbif_id);
        usleep($DELAY_US);

        if ($imageUrl) {
            $update->execute([json_encode([$imageUrl]), $plant->id]);
            $updated++;
        } else {
            $failed++;
        }

        $lastId = $plant->id;
    }

    file_put_contents($PROGRESS_FILE, $lastId);
    echo "  ✅ {$updated} saved | ❌ {$failed} not found | last_id {$lastId}\n";
}

if (file_exists($PROGRESS_FILE)) unlink($PROGRESS_FILE);

echo "\n════════════════════════════════\n";
echo "📸 Images saved  : {$updated}\n";
echo "❌ Not found     : {$failed}\n";
