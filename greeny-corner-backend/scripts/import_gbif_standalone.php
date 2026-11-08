<?php

/**
 * Import plant species from GBIF — STANDALONE version (no Laravel bootstrap).
 *
 * Uses PDO directly to avoid the HTTP 404 issue caused by Laravel's bootstrap
 * interfering with PHP curl configuration.
 *
 * Usage:  php scripts/import_gbif_standalone.php [start_offset]
 * Resume: php scripts/import_gbif_standalone.php 9900
 */

// ── Database config ───────────────────────────────────────────────────────────

$DB_HOST = '127.0.0.1';
$DB_NAME = 'u436103792_greenycorner';
$DB_USER = 'u436103792_greenycorner';
$DB_PASS = 'SSHloginpass123!';

try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Exception $e) {
    die("DB connection failed: " . $e->getMessage() . "\n");
}

// ── Config ────────────────────────────────────────────────────────────────────

$BATCH_SIZE    = 300;
$DELAY_MS      = 800;
$PROGRESS_FILE = '/tmp/gbif_standalone_progress.txt';

$startOffset = (int)($argv[1] ?? (file_exists($PROGRESS_FILE) ? (int)file_get_contents($PROGRESS_FILE) : 0));

// ── Helpers ───────────────────────────────────────────────────────────────────

function gbifGet(string $url): ?array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT      => 'GreenyCorneer/1.0 (greenycorner.ae)',
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);
    $response = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error     = curl_error($ch);
    curl_close($ch);

    if ($error) {
        echo "  curl error: {$error}\n";
        return null;
    }
    if ($httpCode !== 200) {
        echo "  HTTP {$httpCode} for: {$url}\n";
        return null;
    }
    return json_decode($response, true);
}

function slugify(string $name): string
{
    $slug = strtolower(trim($name));
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    $slug = preg_replace('/[\s-]+/', '-', $slug);
    return trim($slug, '-');
}

function uniqueSlug(PDO $pdo, string $base): string
{
    $slug  = $base;
    $count = 1;
    $stmt  = $pdo->prepare("SELECT 1 FROM plant_encyclopedia WHERE slug = ? LIMIT 1");
    while (true) {
        $stmt->execute([$slug]);
        if (!$stmt->fetchColumn()) break;
        $slug = $base . '-' . $count++;
    }
    return $slug;
}

function extractEnglishName(array $vernacularNames): ?string
{
    foreach ($vernacularNames as $v) {
        $lang = strtolower($v['language'] ?? '');
        if (in_array($lang, ['eng', 'en', 'english']) && !empty($v['vernacularName'])) {
            return ucfirst(strtolower($v['vernacularName']));
        }
    }
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

echo "🌿 Greeny Corner — GBIF Standalone Importer\n";
echo "   Resuming from offset: {$startOffset}\n";
echo "   (No Laravel bootstrap — pure PHP + PDO)\n\n";

$offset   = $startOffset;
$inserted = 0;
$skipped  = 0;
$total    = 0;

$insertStmt = $pdo->prepare("
    INSERT IGNORE INTO plant_encyclopedia
        (slug, name, scientific_name, family, genus, common_names, gbif_id,
         is_featured, sources, description_ar, created_at, updated_at)
    VALUES
        (:slug, :name, :scientific_name, :family, :genus, :common_names, :gbif_id,
         0, :sources, :description_ar, NOW(), NOW())
");

$checkSlug = $pdo->prepare("SELECT 1 FROM plant_encyclopedia WHERE slug = ? LIMIT 1");
$checkSci  = $pdo->prepare("SELECT 1 FROM plant_encyclopedia WHERE scientific_name = ? LIMIT 1");

do {
    $url = "https://api.gbif.org/v1/species/search?"
         . http_build_query([
               'highertaxonKey'   => 6,
               'rank'             => 'SPECIES',
               'status'           => 'ACCEPTED',
               'hasVernacularName' => 'true',
               'limit'            => $BATCH_SIZE,
               'offset'           => $offset,
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

        if (!$canonicalName) { $skipped++; continue; }

        $displayName = $commonName ?: $canonicalName;
        $slug        = slugify($displayName);

        // Check slug collision
        $checkSlug->execute([$slug]);
        if ($checkSlug->fetchColumn()) {
            // Check if same scientific name already exists
            $checkSci->execute([$canonicalName]);
            if ($checkSci->fetchColumn()) {
                $skipped++;
                continue;
            }
            $slug = uniqueSlug($pdo, $slug);
        }

        $allCommonNames = array_values(array_filter(
            array_unique(array_map(fn($v) => $v['vernacularName'] ?? null, $vernacularNames))
        ));

        try {
            $insertStmt->execute([
                ':slug'            => $slug,
                ':name'            => $displayName,
                ':scientific_name' => $canonicalName,
                ':family'          => $p['family'] ?? null,
                ':genus'           => $p['genus'] ?? null,
                ':common_names'    => !empty($allCommonNames) ? json_encode($allCommonNames) : null,
                ':gbif_id'         => $p['key'] ?? null,
                ':sources'         => json_encode(['gbif']),
                ':description_ar'  => $arabicName,
            ]);

            if ($insertStmt->rowCount() > 0) {
                $inserted++;
                if ($inserted % 100 === 0) {
                    echo "  ✅ {$inserted} inserted so far (offset {$offset})\n";
                }
            } else {
                $skipped++;
            }
        } catch (Exception $e) {
            echo "  ⚠ Insert error for {$displayName}: " . $e->getMessage() . "\n";
            $skipped++;
        }
    }

    $offset += $BATCH_SIZE;
    file_put_contents($PROGRESS_FILE, $offset);

    $pct = $totalCount > 0 ? round(($offset / $totalCount) * 100, 1) : '?';
    echo "   Progress: {$offset}/{$totalCount} ({$pct}%) — inserted: {$inserted} skipped: {$skipped}\n\n";

    usleep($DELAY_MS * 1000);

} while (!($data['endOfRecords'] ?? false) && $offset < 600000);

if (file_exists($PROGRESS_FILE)) unlink($PROGRESS_FILE);

echo "\n════════════════════════════════\n";
echo "✅ Inserted : {$inserted}\n";
echo "⏭  Skipped  : {$skipped}\n";
echo "📊 Total    : {$total}\n";
echo "\nNext: run update_plant_images_unsplash.php to add images.\n";
