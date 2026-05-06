<?php

namespace App\Console\Commands;

use App\Models\PlantEncyclopedia;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ImportGbifPlants extends Command
{
    protected $signature = 'plants:import-gbif
                            {--total=5000 : Total species to process}
                            {--offset=0 : Starting offset}
                            {--limit=300 : Species per GBIF request (max 300)}';

    protected $description = 'Import/enrich plants from GBIF (free, no API key required)';

    public function handle(): int
    {
        $total   = (int) $this->option('total');
        $offset  = (int) $this->option('offset');
        $limit   = min((int) $this->option('limit'), 300);
        $processed = 0;
        $errors  = 0;

        $this->info("Importing up to {$total} plants from GBIF...");

        while ($processed < $total) {
            $this->info("Offset {$offset}...");

            try {
                $response = Http::timeout(30)->get('https://api.gbif.org/v1/species/search', [
                    'highertaxonKey' => 6,
                    'rank'     => 'SPECIES',
                    'status'   => 'ACCEPTED',
                    'nameType' => 'SCIENTIFIC',
                    'limit'    => $limit,
                    'offset'   => $offset,
                ]);

                if (!$response->successful()) {
                    $this->warn("HTTP {$response->status()} — stopping.");
                    break;
                }

                $data    = $response->json();
                $species = $data['results'] ?? [];

                if (empty($species)) {
                    $this->info('No more species from GBIF.');
                    break;
                }

                foreach ($species as $sp) {
                    try {
                        $gbifKey        = $sp['key'] ?? null;
                        $scientificName = $sp['canonicalName'] ?? $sp['scientificName'] ?? null;

                        if (!$gbifKey || !$scientificName) continue;

                        // Enrich an existing Perenual record if scientific name matches
                        $existing = PlantEncyclopedia::where('scientific_name', $scientificName)->first();

                        if ($existing) {
                            $updates  = ['gbif_id' => $gbifKey];
                            $sources  = $existing->sources ?? [];
                            if (!in_array('gbif', $sources)) {
                                $sources[]        = 'gbif';
                                $updates['sources'] = $sources;
                            }
                            if (!$existing->family && !empty($sp['family'])) {
                                $updates['family'] = $sp['family'];
                            }
                            if (!$existing->genus && !empty($sp['genus'])) {
                                $updates['genus'] = $sp['genus'];
                            }
                            $existing->update($updates);
                            $processed++;
                            continue;
                        }

                        // Skip if already imported by GBIF id
                        if (PlantEncyclopedia::where('gbif_id', $gbifKey)->exists()) {
                            continue;
                        }

                        // Create a new minimal record from GBIF
                        $name = $sp['vernacularName'] ?? $sp['canonicalName'] ?? $scientificName;
                        $slug = Str::slug($name);
                        $base = $slug;
                        $c    = 1;
                        while (PlantEncyclopedia::where('slug', $slug)->exists()) {
                            $slug = $base . '-' . $c++;
                        }

                        PlantEncyclopedia::create([
                            'slug'            => $slug,
                            'name'            => $name,
                            'scientific_name' => $scientificName,
                            'family'          => $sp['family'] ?? null,
                            'genus'           => $sp['genus'] ?? null,
                            'gbif_id'         => $gbifKey,
                            'sources'         => ['gbif'],
                        ]);

                        $processed++;
                        $this->line("  ✓ {$scientificName}");

                    } catch (\Exception $e) {
                        $this->warn("  ✗ {$e->getMessage()}");
                        $errors++;
                    }
                }

                $offset += $limit;
                if ($data['endOfRecords'] ?? false) break;

                sleep(1);

            } catch (\Exception $e) {
                $this->error("Error: {$e->getMessage()}");
                $errors++;
                break;
            }
        }

        $this->info("\nDone — processed: {$processed}, errors: {$errors}");
        return 0;
    }
}
