<?php

namespace App\Console\Commands;

use App\Models\PlantEncyclopedia;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class EnrichWithWikipedia extends Command
{
    protected $signature = 'plants:enrich-wikipedia
                            {--limit=100 : Number of plants to process}
                            {--overwrite : Overwrite existing descriptions}';

    protected $description = 'Enrich plant encyclopedia entries with Wikipedia descriptions and images';

    public function handle(): int
    {
        $limit     = (int) $this->option('limit');
        $overwrite = (bool) $this->option('overwrite');

        $query = PlantEncyclopedia::whereNotNull('scientific_name');
        if (!$overwrite) {
            $query->whereNull('description');
        }

        $plants   = $query->orderByDesc('view_count')->limit($limit)->get();
        $enriched = 0;
        $notFound = 0;
        $errors   = 0;

        $this->info("Enriching {$plants->count()} plants with Wikipedia...");

        foreach ($plants as $plant) {
            try {
                $found = false;
                $searchTerms = array_unique(array_filter([
                    $plant->scientific_name,
                    $plant->name !== $plant->scientific_name ? $plant->name : null,
                ]));

                foreach ($searchTerms as $term) {
                    $response = Http::timeout(15)->get('https://en.wikipedia.org/w/api.php', [
                        'action'      => 'query',
                        'titles'      => $term,
                        'prop'        => 'extracts|info|pageimages',
                        'exintro'     => true,
                        'explaintext' => true,
                        'inprop'      => 'url',
                        'pithumbsize' => 800,
                        'format'      => 'json',
                        'redirects'   => true,
                    ]);

                    if (!$response->successful()) continue;

                    $pages = $response->json('query.pages', []);
                    $page  = array_values($pages)[0] ?? null;

                    if (!$page || isset($page['missing'])) continue;

                    $extract = $page['extract'] ?? null;
                    if (!$extract || strlen($extract) < 80) continue;

                    // Clean pronunciation guides and extra whitespace
                    $clean = preg_replace('/\(\/[^)]+\/\)/', '', $extract);
                    $clean = preg_replace('/\s+/', ' ', $clean);
                    $clean = trim($clean);

                    $updates = ['wikipedia_url' => $page['fullurl'] ?? null];

                    if (!$plant->description || $overwrite) {
                        $updates['description'] = $clean;
                    }

                    // Prepend Wikipedia thumbnail if no images yet
                    $thumb = $page['thumbnail']['source'] ?? null;
                    if ($thumb) {
                        $images = $plant->images ?? [];
                        if (!in_array($thumb, $images)) {
                            array_unshift($images, $thumb);
                            $updates['images'] = $images;
                        }
                    }

                    $sources = $plant->sources ?? [];
                    if (!in_array('wikipedia', $sources)) {
                        $sources[]          = 'wikipedia';
                        $updates['sources'] = $sources;
                    }

                    $plant->update($updates);
                    $enriched++;
                    $found = true;
                    $this->line("  ✓ {$plant->name}");
                    break;
                }

                if (!$found) {
                    $notFound++;
                    $this->line("  - Not found: {$plant->name}");
                }

                sleep(1);

            } catch (\Exception $e) {
                $this->warn("  ✗ {$plant->name}: {$e->getMessage()}");
                $errors++;
            }
        }

        $this->info("\nDone — enriched: {$enriched}, not found: {$notFound}, errors: {$errors}");
        return 0;
    }
}
