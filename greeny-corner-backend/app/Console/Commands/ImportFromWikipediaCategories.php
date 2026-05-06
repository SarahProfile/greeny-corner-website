<?php

namespace App\Console\Commands;

use App\Models\PlantEncyclopedia;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ImportFromWikipediaCategories extends Command
{
    protected $signature = 'plants:import-wikipedia-categories
                            {--limit=5000 : Max plants to import}';

    protected $description = 'Import well-known plants from Wikipedia plant categories';

    private array $categories = [
        'Houseplants',
        'Succulent plants',
        'Cacti',
        'Orchids',
        'Herbs',
        'Medicinal plants',
        'Garden plants',
        'Ornamental plants',
        'Flowering plants by common name',
        'Trees',
        'Shrubs',
        'Tropical plants',
        'Aquatic plants',
        'Ferns',
        'Bamboo',
        'Palms',
        'Roses',
        'Bonsai',
        'Carnivorous plants',
        'Air plants',
        'Bulbous plants',
        'Groundcovers',
        'Vines',
        'Vegetables',
        'Fruit trees',
        'Edible plants',
        'Aromatic plants',
        'Indoor plants',
    ];

    public function handle(): int
    {
        $limit     = (int) $this->option('limit');
        $imported  = 0;
        $skipped   = 0;
        $processed = [];

        $this->info("Importing well-known plants from Wikipedia categories...");

        foreach ($this->categories as $category) {
            if ($imported >= $limit) break;

            $this->info("\n📚 Category: {$category}");
            $members = $this->getCategoryMembers($category);

            foreach ($members as $title) {
                if ($imported >= $limit) break;
                if (isset($processed[$title])) { $skipped++; continue; }
                $processed[$title] = true;

                $data = $this->getWikipediaData($title);
                if (!$data) { $skipped++; continue; }

                if ($this->storeOrUpdate($data)) {
                    $imported++;
                    $this->line("  ✓ {$data['name']}");
                } else {
                    $skipped++;
                }
            }

            sleep(1);
        }

        $this->info("\nDone — imported: {$imported}, skipped/existing: {$skipped}");
        return 0;
    }

    private function getCategoryMembers(string $category): array
    {
        $titles   = [];
        $cmcontinue = null;

        do {
            $params = [
                'action'      => 'query',
                'list'        => 'categorymembers',
                'cmtitle'     => "Category:{$category}",
                'cmtype'      => 'page',
                'cmlimit'     => 500,
                'cmnamespace' => 0,
                'format'      => 'json',
            ];
            if ($cmcontinue) $params['cmcontinue'] = $cmcontinue;

            try {
                $res = Http::timeout(15)
                    ->withHeaders(['User-Agent' => 'GreenyCornorBot/1.0 (plant encyclopedia)'])
                    ->get('https://en.wikipedia.org/w/api.php', $params);

                if (!$res->successful()) break;
                $data = $res->json();

                foreach ($data['query']['categorymembers'] ?? [] as $member) {
                    $titles[] = $member['title'];
                }

                $cmcontinue = $data['continue']['cmcontinue'] ?? null;
            } catch (\Exception) {
                break;
            }
        } while ($cmcontinue && count($titles) < 2000);

        return $titles;
    }

    private function getWikipediaData(string $title): ?array
    {
        try {
            $res = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'GreenyCornerBot/1.0 (plant encyclopedia)'])
                ->get('https://en.wikipedia.org/w/api.php', [
                    'action'      => 'query',
                    'titles'      => $title,
                    'prop'        => 'extracts|pageimages|categories|revisions',
                    'exintro'     => true,
                    'exchars'     => 600,
                    'piprop'      => 'original',
                    'rvprop'      => 'content',
                    'rvsection'   => '0',
                    'cllimit'     => 20,
                    'format'      => 'json',
                    'redirects'   => true,
                ]);

            if (!$res->successful()) return null;

            $pages = $res->json()['query']['pages'] ?? [];
            $page  = reset($pages);

            if (!$page || isset($page['missing'])) return null;

            $extract = strip_tags($page['extract'] ?? '');
            if (strlen($extract) < 50) return null;

            // Check it's actually about a plant
            $categories = array_column($page['categories'] ?? [], 'title');
            $catStr     = strtolower(implode(' ', $categories));
            $plantWords = ['plant', 'flora', 'tree', 'herb', 'flower', 'shrub', 'fern', 'moss', 'alga', 'grass', 'palm', 'cactus', 'orchid', 'succulent', 'vine', 'fruit', 'vegetable', 'species', 'genus', 'family'];
            $isPlant    = false;
            foreach ($plantWords as $w) {
                if (str_contains($catStr, $w)) { $isPlant = true; break; }
            }
            // Also accept if description mentions plant keywords
            if (!$isPlant) {
                $extractLow = strtolower($extract);
                foreach (['plant', 'species', 'genus', 'family', 'flowering', 'leaf', 'leaves', 'botanical', 'native to', 'grow'] as $w) {
                    if (str_contains($extractLow, $w)) { $isPlant = true; break; }
                }
            }
            if (!$isPlant) return null;

            // Extract scientific name from first parenthetical if present
            $scientificName = null;
            if (preg_match('/\(([A-Z][a-z]+ [a-z]+(?:\s[a-z]+)?)\)/', $extract, $m)) {
                $scientificName = $m[1];
            }

            $image = $page['original']['source'] ?? null;

            return [
                'name'            => $title,
                'scientific_name' => $scientificName,
                'description'     => $this->cleanExtract($extract),
                'images'          => $image ? [$image] : [],
                'wikipedia_url'   => "https://en.wikipedia.org/wiki/" . urlencode(str_replace(' ', '_', $title)),
                'sources'         => ['wikipedia'],
            ];
        } catch (\Exception) {
            return null;
        }
    }

    private function cleanExtract(string $text): string
    {
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);
        // Remove citation markers like [1], [2]
        $text = preg_replace('/\[\d+\]/', '', $text);
        return $text;
    }

    private function storeOrUpdate(array $data): bool
    {
        $name = $data['name'];

        // Check by Wikipedia URL or name
        $existing = PlantEncyclopedia::where('wikipedia_url', $data['wikipedia_url'])
            ->orWhere('name', $name)
            ->first();

        if ($existing) {
            // Enrich existing with description/image if missing
            $updates = [];
            if (!$existing->description && $data['description']) {
                $updates['description'] = $data['description'];
            }
            if (empty($existing->images) && !empty($data['images'])) {
                $updates['images'] = $data['images'];
            }
            if (!$existing->wikipedia_url && $data['wikipedia_url']) {
                $updates['wikipedia_url'] = $data['wikipedia_url'];
            }
            if ($updates) $existing->update($updates);
            return false; // not a new record
        }

        $slug = Str::slug($name);
        $base = $slug;
        $c    = 1;
        while (PlantEncyclopedia::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $c++;
        }

        PlantEncyclopedia::create([
            'slug'            => $slug,
            'name'            => $name,
            'scientific_name' => $data['scientific_name'],
            'description'     => $data['description'],
            'images'          => $data['images'],
            'wikipedia_url'   => $data['wikipedia_url'],
            'sources'         => $data['sources'],
        ]);

        return true;
    }
}
