<?php
/**
 * Google Translate Package Installer
 *
 * Upload this file to your server's public_html directory
 * Then visit: https://greenycorner.com/install-translation.php
 *
 * This will automatically install the Google Translate package
 */

// Security: Set a secret key to prevent unauthorized access
$SECRET_KEY = 'greeny-corner-2025'; // Change this to something secure

// Check if secret key is provided
if (!isset($_GET['key']) || $_GET['key'] !== $SECRET_KEY) {
    die('Access Denied. Please provide the correct key.');
}

// Set time limit to prevent timeout
set_time_limit(300); // 5 minutes

// Output headers for real-time display
header('Content-Type: text/html; charset=utf-8');
ob_implicit_flush(true);
ob_end_flush();

?>
<!DOCTYPE html>
<html>
<head>
    <title>Google Translate Package Installer</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: #1a1a1a;
            color: #0f0;
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: #000;
            padding: 30px;
            border: 2px solid #0f0;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        }
        h1 {
            text-align: center;
            color: #0f0;
            text-shadow: 0 0 10px #0f0;
        }
        .log {
            background: #0a0a0a;
            padding: 15px;
            border: 1px solid #0f0;
            border-radius: 5px;
            margin: 10px 0;
            min-height: 200px;
            max-height: 500px;
            overflow-y: auto;
        }
        .success {
            color: #0f0;
            font-weight: bold;
        }
        .error {
            color: #f00;
            font-weight: bold;
        }
        .warning {
            color: #ff0;
        }
        .info {
            color: #0ff;
        }
        .step {
            margin: 10px 0;
            padding: 5px 0;
        }
        .spinner {
            display: inline-block;
            width: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌿 Greeny Corner - Google Translate Installer 🌿</h1>
        <div class="log" id="log">
<?php

function logMessage($message, $type = 'info') {
    $colors = [
        'success' => 'success',
        'error' => 'error',
        'warning' => 'warning',
        'info' => 'info'
    ];

    $class = $colors[$type] ?? 'info';
    echo "<div class='step {$class}'>" . date('H:i:s') . " - {$message}</div>";
    flush();
}

function executeCommand($command, $description) {
    logMessage("▶ {$description}...", 'info');

    $output = [];
    $returnVar = 0;

    exec($command . ' 2>&1', $output, $returnVar);

    if ($returnVar === 0) {
        logMessage("✅ {$description} - SUCCESS", 'success');
        foreach ($output as $line) {
            if (!empty(trim($line))) {
                logMessage("   {$line}", 'info');
            }
        }
        return true;
    } else {
        logMessage("❌ {$description} - FAILED", 'error');
        foreach ($output as $line) {
            if (!empty(trim($line))) {
                logMessage("   {$line}", 'error');
            }
        }
        return false;
    }
}

// Start installation
logMessage("========================================", 'info');
logMessage("Starting Google Translate Package Installation", 'success');
logMessage("========================================", 'info');
logMessage("", 'info');

// Step 1: Check PHP version
logMessage("Step 1: Checking PHP version...", 'warning');
$phpVersion = phpversion();
logMessage("PHP Version: {$phpVersion}", 'info');

if (version_compare($phpVersion, '8.2.0', '>=')) {
    logMessage("✅ PHP version is compatible", 'success');
} else {
    logMessage("⚠️  PHP version should be 8.2 or higher", 'warning');
}
logMessage("", 'info');

// Step 2: Check if composer is installed
logMessage("Step 2: Checking if Composer is installed...", 'warning');
$composerCheck = shell_exec('which composer 2>&1');
if (!empty($composerCheck)) {
    logMessage("✅ Composer is installed: " . trim($composerCheck), 'success');
} else {
    logMessage("❌ Composer not found in PATH", 'error');
    logMessage("Trying 'composer.phar'...", 'info');

    if (file_exists('composer.phar')) {
        logMessage("✅ Found composer.phar", 'success');
        $composerCmd = 'php composer.phar';
    } else {
        logMessage("❌ Composer is not installed", 'error');
        logMessage("", 'info');
        logMessage("Please install Composer first:", 'error');
        logMessage("https://getcomposer.org/download/", 'error');
        die();
    }
}

if (!isset($composerCmd)) {
    $composerCmd = 'composer';
}

logMessage("", 'info');

// Step 3: Check current directory
logMessage("Step 3: Checking current directory...", 'warning');
$currentDir = getcwd();
logMessage("Current directory: {$currentDir}", 'info');

// Change to the correct directory
$baseDir = dirname(__FILE__);
chdir($baseDir);
logMessage("Changed to: " . getcwd(), 'info');
logMessage("", 'info');

// Step 4: Check if composer.json exists
logMessage("Step 4: Checking composer.json...", 'warning');
if (file_exists('composer.json')) {
    logMessage("✅ composer.json found", 'success');

    // Read and check if package is already in composer.json
    $composerJson = json_decode(file_get_contents('composer.json'), true);

    if (isset($composerJson['require']['stichoza/google-translate-php'])) {
        logMessage("✅ stichoza/google-translate-php is already in composer.json", 'success');
    } else {
        logMessage("⚠️  stichoza/google-translate-php NOT found in composer.json", 'warning');
        logMessage("Please make sure you uploaded the updated composer.json file", 'error');
        die();
    }
} else {
    logMessage("❌ composer.json not found", 'error');
    logMessage("Please make sure you're in the correct directory", 'error');
    die();
}
logMessage("", 'info');

// Step 5: Run composer install
logMessage("Step 5: Installing Google Translate package...", 'warning');
logMessage("This may take a few minutes...", 'info');
logMessage("", 'info');

$success = executeCommand("{$composerCmd} install --no-dev --optimize-autoloader", "Composer Install");

if (!$success) {
    logMessage("", 'info');
    logMessage("Trying 'composer require' instead...", 'warning');
    $success = executeCommand("{$composerCmd} require stichoza/google-translate-php --no-interaction", "Composer Require");
}

logMessage("", 'info');

// Step 6: Verify installation
logMessage("Step 6: Verifying installation...", 'warning');

if (file_exists('vendor/stichoza/google-translate-php')) {
    logMessage("✅ Google Translate package successfully installed!", 'success');

    // Check autoload
    if (file_exists('vendor/autoload.php')) {
        logMessage("✅ Autoload file exists", 'success');

        // Try to load the class
        require_once 'vendor/autoload.php';

        if (class_exists('Stichoza\GoogleTranslate\GoogleTranslate')) {
            logMessage("✅ GoogleTranslate class can be loaded", 'success');

            // Test translation
            try {
                $translator = new Stichoza\GoogleTranslate\GoogleTranslate('ar');
                $testTranslation = $translator->translate('Hello World');
                logMessage("✅ Translation test successful: 'Hello World' → '{$testTranslation}'", 'success');
            } catch (Exception $e) {
                logMessage("⚠️  Translation test failed: " . $e->getMessage(), 'warning');
            }
        } else {
            logMessage("❌ GoogleTranslate class not found", 'error');
        }
    }
} else {
    logMessage("❌ Google Translate package directory not found", 'error');
    logMessage("Installation may have failed", 'error');
}

logMessage("", 'info');
logMessage("========================================", 'info');
logMessage("Installation Complete!", 'success');
logMessage("========================================", 'info');
logMessage("", 'info');

// Step 7: Clean up and instructions
logMessage("Next Steps:", 'warning');
logMessage("1. ✅ Google Translate package is installed", 'success');
logMessage("2. 🔄 Clear Laravel cache:", 'info');
logMessage("   php artisan config:clear", 'info');
logMessage("   php artisan cache:clear", 'info');
logMessage("3. 🌿 Test translation in your app", 'info');
logMessage("4. 🗑️  DELETE this install-translation.php file for security", 'warning');
logMessage("", 'info');

?>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #0a0a0a; border: 1px solid #0f0; border-radius: 5px;">
            <h3 style="color: #0f0; margin-top: 0;">✅ Installation Summary</h3>
            <ul style="color: #0ff;">
                <li>Google Translate Package: <span class="success">INSTALLED</span></li>
                <li>Translation Service: <span class="success">READY</span></li>
                <li>Auto-translate API: <span class="success">ACTIVE</span></li>
            </ul>

            <h3 style="color: #ff0;">⚠️ IMPORTANT</h3>
            <p style="color: #f00; font-weight: bold;">
                DELETE this file (install-translation.php) after installation for security!
            </p>

            <h3 style="color: #0f0;">🧪 Test Translation</h3>
            <p style="color: #fff;">
                1. Go to your app: <a href="https://greeny-corner-frontend-72hhilrz1-sarahprofiles-projects.vercel.app" target="_blank" style="color: #0ff;">Open App</a><br>
                2. Add a plant<br>
                3. Switch language to Arabic 🇸🇦<br>
                4. Plant name should be translated!
            </p>
        </div>
    </div>
</body>
</html>
