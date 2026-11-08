<?php

/**
 * Import ALL plant species from GBIF by querying family-by-family.
 *
 * Bypasses GBIF's ~9,900-record pagination cap on broad queries by
 * fetching each of the ~1,584 plant families separately.
 *
 * Usage:  php scripts/import_gbif_by_family.php [resume_family_offset]
 * Resume: php scripts/import_gbif_by_family.php 120   ← skip first 120 families
 *
 * Safe to stop and restart at any time.
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

$BATCH_SIZE           = 300;
$FAMILY_BATCH         = 100;   // how many families to fetch at once
$DELAY_BETWEEN_CALLS  = 600;   // µs between GBIF API calls (600ms)
$PROGRESS_FILE        = '/tmp/gbif_family_progress.txt';
$FAMILIES_CACHE_FILE  = '/tmp/gbif_families_cache.json';

// Resume: which family index to start from
$resumeAt = (int)($argv[1] ?? (file_exists($PROGRESS_FILE)
    ? (int)file_get_contents($PROGRESS_FILE)
    : 0));

// ── HTTP Helper ───────────────────────────────────────────────────────────────

function gbifGet(string $url): ?array
{
    static $lastCall = 0;
    $wait = 600000 - (microtime(true) * 1000000 - $lastCall);
    if ($wait > 0) usleep((int)$wait);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT      => 'GreenyCorneer/1.0 (greenycorner.ae; contact sarahnasereldeen17@gmail.com)',
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);
    $response = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error     = curl_error($ch);
    curl_close($ch);
    $lastCall  = microtime(true) * 1000000;

    if ($error || $httpCode !== 200) {
        if ($error) echo "  curl error: {$error}\n";
        else        echo "  HTTP {$httpCode}\n";
        return null;
    }
    return json_decode($response, true);
}

// ── Slug Helpers ──────────────────────────────────────────────────────────────

function slugify(string $name): string
{
    $s = strtolower(trim($name));
    $s = preg_replace('/[^a-z0-9\s-]/', '', $s);
    $s = preg_replace('/[\s-]+/', '-', $s);
    return trim($s, '-');
}

function uniqueSlug(PDO $pdo, string $base): string
{
    static $cache = [];
    $slug  = $base;
    $count = 1;
    $stmt  = $pdo->prepare("SELECT 1 FROM plant_encyclopedia WHERE slug = ? LIMIT 1");
    while (true) {
        if (!isset($cache[$slug])) {
            $stmt->execute([$slug]);
            if (!$stmt->fetchColumn()) { $cache[$slug] = true; break; }
        }
        $slug = $base . '-' . $count++;
    }
    return $slug;
}

// ── Name Extractors ───────────────────────────────────────────────────────────

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

// ── Insert a batch of species results ────────────────────────────────────────

function insertSpecies(PDO $pdo, array $results, int &$inserted, int &$skipped): void
{
    static $checkSci  = null;
    static $checkSlug = null;
    static $insert    = null;

    if (!$checkSci) {
        $checkSci  = $pdo->prepare("SELECT 1 FROM plant_encyclopedia WHERE scientific_name = ? LIMIT 1");
        $checkSlug = $pdo->prepare("SELECT 1 FROM plant_encyclopedia WHERE slug = ? LIMIT 1");
        $insert    = $pdo->prepare("
            INSERT IGNORE INTO plant_encyclopedia
                (slug, name, scientific_name, family, genus, common_names, gbif_id,
                 is_featured, sources, description_ar, created_at, updated_at)
            VALUES
                (:slug, :name, :scientific_name, :family, :genus, :common_names, :gbif_id,
                 0, :sources, :description_ar, NOW(), NOW())
        ");
    }

    foreach ($results as $p) {
        $canonicalName   = $p['canonicalName'] ?? null;
        if (!$canonicalName) { $skipped++; continue; }

        // Skip if scientific name already in DB
        $checkSci->execute([$canonicalName]);
        if ($checkSci->fetchColumn()) { $skipped++; continue; }

        $vernacularNames = $p['vernacularNames'] ?? [];
        $commonName      = extractEnglishName($vernacularNames);
        $arabicName      = extractArabicName($vernacularNames);
        $displayName     = $commonName ?: $canonicalName;

        $baseSlug = slugify($displayName);
        $checkSlug->execute([$baseSlug]);
        $slug = $checkSlug->fetchColumn() ? uniqueSlug($pdo, $baseSlug) : $baseSlug;

        $allCommonNames = array_values(array_filter(
            array_unique(array_map(fn($v) => $v['vernacularName'] ?? null, $vernacularNames))
        ));

        try {
            $insert->execute([
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

            if ($insert->rowCount() > 0) {
                $inserted++;
            } else {
                $skipped++;
            }
        } catch (Exception $e) {
            echo "  ⚠ DB error for {$displayName}: " . $e->getMessage() . "\n";
            $skipped++;
        }
    }
}

// ── Fetch all species for one family key ──────────────────────────────────────

function importFamily(PDO $pdo, int $familyKey, string $familyName, int &$inserted, int &$skipped): void
{
    global $BATCH_SIZE;

    // First check count to decide strategy
    $countData = gbifGet("https://api.gbif.org/v1/species/search?" . http_build_query([
        'highertaxonKey'   => $familyKey,
        'rank'             => 'SPECIES',
        'status'           => 'ACCEPTED',
        'hasVernacularName' => 'true',
        'limit'            => 1,
        'offset'           => 0,
    ]));
    $familyCount = $countData['count'] ?? 0;

    if ($familyCount === 0) {
        return;
    }

    if ($familyCount >= 9000) {
        echo "    ⚡ {$familyName} has {$familyCount} species — switching to genus-by-genus\n";
        importFamilyByGenus($pdo, $familyKey, $familyName, $inserted, $skipped);
        return;
    }

    $offset = 0;
    $familyInserted = 0;

    do {
        $url = "https://api.gbif.org/v1/species/search?" . http_build_query([
            'highertaxonKey'   => $familyKey,
            'rank'             => 'SPECIES',
            'status'           => 'ACCEPTED',
            'hasVernacularName' => 'true',
            'limit'            => $BATCH_SIZE,
            'offset'           => $offset,
        ]);

        $data = gbifGet($url);

        if (!$data || empty($data['results'])) break;

        $before = $inserted;
        insertSpecies($pdo, $data['results'], $inserted, $skipped);
        $familyInserted += ($inserted - $before);
        $offset += $BATCH_SIZE;

    } while (!($data['endOfRecords'] ?? true));

    if ($familyInserted > 0) {
        echo "    ✓ {$familyName}: +{$familyInserted} new\n";
    }
}

// ── Fallback: import a large family genus by genus ────────────────────────────

function importFamilyByGenus(PDO $pdo, int $familyKey, string $familyName, int &$inserted, int &$skipped): void
{
    global $BATCH_SIZE;

    // Fetch all genera in this family using highertaxonKey
    $genusOffset = 0;
    $genera      = [];

    do {
        $url  = "https://api.gbif.org/v1/species/search?" . http_build_query([
            'highertaxonKey' => $familyKey,
            'rank'           => 'GENUS',
            'status'         => 'ACCEPTED',
            'limit'          => 300,
            'offset'         => $genusOffset,
        ]);
        $data = gbifGet($url);
        if (!$data || empty($data['results'])) break;
        foreach ($data['results'] as $g) {
            if (!empty($g['key'])) $genera[] = ['key' => $g['key'], 'name' => $g['canonicalName'] ?? '?'];
        }
        $genusOffset += 300;
    } while (!($data['endOfRecords'] ?? true) && $genusOffset < 9900);

    echo "    Genera in {$familyName}: " . count($genera) . "\n";

    foreach ($genera as $genus) {
        $offset = 0;
        do {
            $url = "https://api.gbif.org/v1/species/search?" . http_build_query([
                'highertaxonKey'   => $genus['key'],
                'rank'             => 'SPECIES',
                'status'           => 'ACCEPTED',
                'hasVernacularName' => 'true',
                'limit'            => $BATCH_SIZE,
                'offset'           => $offset,
            ]);
            $data = gbifGet($url);
            if (!$data || empty($data['results'])) break;
            insertSpecies($pdo, $data['results'], $inserted, $skipped);
            $offset += $BATCH_SIZE;
        } while (!($data['endOfRecords'] ?? true) && $offset < 9900);
    }

    echo "    ✓ {$familyName} (by genus): done\n";
}

// ── Step 1: Load/cache all plant family keys ──────────────────────────────────

echo "🌿 Greeny Corner — GBIF Family-by-Family Importer\n";
echo "   (Bypasses 9,900-record pagination cap)\n\n";

if (file_exists($FAMILIES_CACHE_FILE)) {
    echo "📁 Loading families from cache...\n";
    $allFamilies = json_decode(file_get_contents($FAMILIES_CACHE_FILE), true);
} else {
    echo "🔍 Fetching all plant families from GBIF...\n";
    $allFamilies = [];
    $famOffset   = 0;

    do {
        $url  = "https://api.gbif.org/v1/species/search?" . http_build_query([
            'highertaxonKey' => 6,
            'rank'           => 'FAMILY',
            'status'         => 'ACCEPTED',
            'limit'          => 300,
            'offset'         => $famOffset,
        ]);
        $data = gbifGet($url);
        if (!$data || empty($data['results'])) break;
        foreach ($data['results'] as $f) {
            if (!empty($f['key']) && !empty($f['canonicalName'])) {
                $allFamilies[] = ['key' => $f['key'], 'name' => $f['canonicalName']];
            }
        }
        $famOffset += 300;
        echo "  Loaded " . count($allFamilies) . " families so far...\n";
    } while (!($data['endOfRecords'] ?? true));

    file_put_contents($FAMILIES_CACHE_FILE, json_encode($allFamilies));
    echo "✅ " . count($allFamilies) . " families cached.\n\n";
}

$totalFamilies = count($allFamilies);
echo "   Total families: {$totalFamilies}\n";
echo "   Resuming from family index: {$resumeAt}\n\n";

// ── Step 2: Process each family ───────────────────────────────────────────────

$inserted = 0;
$skipped  = 0;

for ($i = $resumeAt; $i < $totalFamilies; $i++) {
    $family = $allFamilies[$i];

    echo "[" . ($i + 1) . "/{$totalFamilies}] {$family['name']} (key:{$family['key']})\n";

    importFamily($pdo, $family['key'], $family['name'], $inserted, $skipped);

    // Save progress after every family
    file_put_contents($PROGRESS_FILE, $i + 1);

    // Print summary every 50 families
    if (($i + 1) % 50 === 0) {
        echo "\n--- Progress: " . ($i + 1) . "/{$totalFamilies} families done | inserted: {$inserted} | skipped: {$skipped} ---\n\n";
    }
}

if (file_exists($PROGRESS_FILE)) unlink($PROGRESS_FILE);

echo "\n════════════════════════════════\n";
echo "✅ Inserted : {$inserted}\n";
echo "⏭  Skipped  : {$skipped}\n";
echo "\nDone! Database now has maximum GBIF coverage.\n";
echo "Next: run update_plant_images_unsplash.php to add images.\n";
