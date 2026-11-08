<?php

/**
 * Translate remaining plant names into Arabic (one at a time — reliable).
 * ~21K names remaining × 300ms = ~1.8 hours.
 *
 * Usage:  php scripts/translate_names_ar.php [last_id]
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

$PROGRESS_FILE = '/tmp/translate_ar_progress.txt';
$DELAY_US      = 300000; // 300ms between API calls
$CHUNK         = 1000;   // rows fetched from DB at once

$lastId = (int)($argv[1] ?? (file_exists($PROGRESS_FILE)
    ? (int)file_get_contents($PROGRESS_FILE)
    : 0));

function translateOne(string $text): ?string
{
    $url = 'https://translate.googleapis.com/translate_a/single?' . http_build_query([
        'client' => 'gtx',
        'sl'     => 'en',
        'tl'     => 'ar',
        'dt'     => 't',
        'q'      => $text,
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT      => 'Mozilla/5.0',
    ]);
    $response = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) return null;

    $json = json_decode($response, true);
    if (!$json || !isset($json[0])) return null;

    $translated = '';
    foreach ($json[0] as $part) {
        if (isset($part[0])) $translated .= $part[0];
    }

    $translated = trim($translated);
    // Accept even if identical (scientific names don't translate — store as-is so they aren't retried)
    return $translated ?: null;
}

echo "🌿 Greeny Corner — Arabic Name Translator (one-by-one mode)\n";
echo "   Resuming from id > {$lastId}\n\n";

$stmt   = $pdo->prepare("
    SELECT id, name FROM plant_encyclopedia
    WHERE id > :last_id AND (name_ar IS NULL OR name_ar = '')
    ORDER BY id ASC
    LIMIT {$CHUNK}
");
$update = $pdo->prepare("UPDATE plant_encyclopedia SET name_ar = ? WHERE id = ?");

$translated = 0;
$failed     = 0;

while (true) {
    $stmt->execute([':last_id' => $lastId]);
    $plants = $stmt->fetchAll(PDO::FETCH_OBJ);

    if (empty($plants)) {
        echo "\n✅ All names translated! Total: {$translated}\n";
        break;
    }

    foreach ($plants as $plant) {
        $ar = translateOne($plant->name);
        if ($ar) {
            $update->execute([$ar, $plant->id]);
            $translated++;
        } else {
            $failed++;
        }
        $lastId = $plant->id;
        usleep($DELAY_US);
    }

    file_put_contents($PROGRESS_FILE, $lastId);
    echo "  ✅ {$translated} translated | ❌ {$failed} failed | last_id {$lastId}\n";
}
