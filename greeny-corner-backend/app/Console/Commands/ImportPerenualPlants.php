<?php

namespace App\Console\Commands;

use App\Models\PlantEncyclopedia;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ImportPerenualPlants extends Command
{
    protected $signature = 'plants:import-perenual
                            {--pages=10 : Number of list pages to fetch}
                            {--start=1 : Starting page number}
                            {--details : Fetch detail page for each plant (slower, uses more API quota)}';

    protected $description = 'Import plants from Perenual API into the encyclopedia';

    public function handle(): int
    {
        $apiKey = env('PERENUAL_API_KEY');
        if (!$apiKey) {
            $this->error('PERENUAL_API_KEY not set in .env');
            return 1;
        }

        $pages     = (int) $this->option('pages');
        $startPage = (int) $this->option('start');
        $fetchDetails = $this->option('details');
        $imported  = 0;
        $errors    = 0;

        $this->info("Importing {$pages} pages from Perenual (start page: {$startPage})...");

        for ($page = $startPage; $page < $startPage + $pages; $page++) {
            $this->info("Page {$page}...");

            try {
                $response = Http::timeout(30)->get('https://perenual.com/api/species-list', [
                    'key'  => $apiKey,
                    'page' => $page,
                ]);

                if (!$response->successful()) {
                    $this->warn("Page {$page} HTTP {$response->status()} — stopping.");
                    break;
                }

                $plants = $response->json('data', []);

                if (empty($plants)) {
                    $this->info("No more plants on page {$page}.");
                    break;
                }

                foreach ($plants as $plant) {
                    try {
                        $detail = [];
                        if ($fetchDetails) {
                            sleep(1);
                            $dr = Http::timeout(30)->get("https://perenual.com/api/species-details/{$plant['id']}", ['key' => $apiKey]);
                            if ($dr->successful()) $detail = $dr->json();
                        }

                        $name = $plant['common_name'] ?? null;
                        if (!$name) {
                            $sci = is_array($plant['scientific_name'] ?? null) ? ($plant['scientific_name'][0] ?? null) : ($plant['scientific_name'] ?? null);
                            $name = $sci ?? 'Unknown Plant';
                        }

                        $scientificName = is_array($plant['scientific_name'] ?? null)
                            ? ($plant['scientific_name'][0] ?? null)
                            : ($plant['scientific_name'] ?? null);

                        // Build slug, ensure unique
                        $slug = Str::slug($name);
                        if ($scientificName && PlantEncyclopedia::where('slug', $slug)->where('perenual_id', '!=', $plant['id'])->exists()) {
                            $slug = Str::slug($scientificName);
                        }
                        $baseSlug = $slug;
                        $counter  = 1;
                        while (PlantEncyclopedia::where('slug', $slug)->where('perenual_id', '!=', $plant['id'])->exists()) {
                            $slug = $baseSlug . '-' . $counter++;
                        }

                        // Images (skip Perenual's upgrade_access placeholder)
                        $images = [];
                        foreach (['regular_url', 'medium_url', 'small_url'] as $key) {
                            $url = $plant['default_image'][$key] ?? null;
                            if ($url && !str_contains($url, 'upgrade_access') && !in_array($url, $images)) {
                                $images[] = $url;
                            }
                        }

                        // Care info
                        $careInfo = null;
                        if (!empty($detail) || !empty($plant)) {
                            $watering     = $detail['watering'] ?? null;
                            $wateringDays = match (strtolower($watering ?? '')) {
                                'frequent' => 3,
                                'average'  => 7,
                                'minimum'  => 14,
                                'none'     => 30,
                                default    => 7,
                            };
                            $sunlight = $detail['sunlight'] ?? [];
                            $careInfo = [
                                'watering_interval_days' => $wateringDays,
                                'watering'               => $watering,
                                'light'                  => is_array($sunlight) ? implode(', ', $sunlight) : ($sunlight ?? null),
                                'difficulty'             => $detail['care_level'] ?? 'Moderate',
                                'soil'                   => is_array($detail['soil'] ?? null) ? implode(', ', $detail['soil']) : ($detail['soil'] ?? null),
                                'pruning'                => is_array($detail['pruning_month'] ?? null) ? implode(', ', $detail['pruning_month']) : null,
                            ];
                            if (!empty($detail['hardiness'])) {
                                $careInfo['temperature'] = "Zones {$detail['hardiness']['min']}-{$detail['hardiness']['max']}";
                            }
                        }

                        // Growth info
                        $growthInfo = null;
                        if (!empty($detail)) {
                            $growthInfo = array_filter([
                                'growth_rate' => $detail['growth_rate'] ?? null,
                                'mature_size' => $detail['dimension'] ?? null,
                                'indoor'      => $detail['indoor'] ?? null,
                                'cycle'       => $detail['cycle'] ?? null,
                                'type'        => $detail['type'] ?? null,
                            ], fn($v) => $v !== null);
                        }

                        // Common names
                        $commonNames = array_unique(array_filter([
                            $plant['common_name'] ?? null,
                            $detail['common_name'] ?? null,
                            ...((array) ($detail['other_name'] ?? [])),
                        ]));

                        // Toxicity
                        $toxicity = null;
                        if (isset($detail['poisonous_to_humans']) || isset($detail['poisonous_to_pets'])) {
                            $human = ($detail['poisonous_to_humans'] ?? false) ? 'Yes' : 'No';
                            $pets  = ($detail['poisonous_to_pets'] ?? false) ? 'Yes' : 'No';
                            $toxicity = "Toxic to humans: {$human}. Toxic to pets: {$pets}.";
                        }

                        PlantEncyclopedia::updateOrCreate(
                            ['perenual_id' => $plant['id']],
                            array_filter([
                                'slug'            => $slug,
                                'name'            => $name,
                                'scientific_name' => $scientificName,
                                'family'          => $detail['family'] ?? null,
                                'genus'           => $detail['genus'] ?? null,
                                'origin'          => is_array($detail['origin'] ?? null) ? implode(', ', $detail['origin']) : ($detail['origin'] ?? null),
                                'description'     => $detail['description'] ?? null,
                                'common_names'    => array_values($commonNames) ?: null,
                                'care_info'       => $careInfo,
                                'growth_info'     => $growthInfo ?: null,
                                'benefits'        => !empty($detail['attracts']) ? (array) $detail['attracts'] : null,
                                'toxicity'        => $toxicity,
                                'images'          => $images ?: null,
                                'sources'         => ['perenual'],
                            ], fn($v) => $v !== null)
                        );

                        $imported++;
                        $this->line("  ✓ {$name}");

                    } catch (\Exception $e) {
                        $this->warn("  ✗ Plant #{$plant['id']}: {$e->getMessage()}");
                        $errors++;
                    }
                }

                sleep(2);

            } catch (\Exception $e) {
                $this->error("Page {$page}: {$e->getMessage()}");
                $errors++;
            }
        }

        $this->info("\nDone — imported: {$imported}, errors: {$errors}");
        return 0;
    }
}
