<?php

namespace App\Console\Commands;

use App\Models\PlantEncyclopedia;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ImportPopularPlants extends Command
{
    protected $signature = 'plants:import-popular
                            {--offset=0 : Skip first N plants in the list}
                            {--limit=2000 : Max plants to process}';

    protected $description = 'Import popular/searchable plants from Wikipedia by curated name list';

    private function plantList(): array
    {
        return [
            // Houseplants
            'Monstera deliciosa', 'Pothos', 'Snake plant', 'Peace lily', 'ZZ plant',
            'Rubber plant', 'Fiddle-leaf fig', 'Boston fern', 'Spider plant', 'Aloe vera',
            'Jade plant', 'Chinese money plant', 'Bird of paradise plant', 'Dracaena',
            'Philodendron', 'Anthuriums', 'Calathea', 'Croton', 'Dieffenbachia',
            'English ivy', 'Heartleaf philodendron', 'Pothos', 'Aglaonema', 'Alocasia',
            'Tradescantia', 'Peperomia', 'Hoya', 'Oxalis', 'Begonia', 'Fittonia',
            'Schefflera', 'Yucca', 'Cast-iron plant', 'Asparagus fern', 'Parlor palm',
            'Areca palm', 'Kentia palm', 'Norfolk Island pine', 'Umbrella plant',
            'Money tree', 'Braided money tree', 'Lucky bamboo', 'Chinese evergreen',
            'Corn plant', 'Dumb cane', 'Elephant ear plant', 'Flamingo flower',
            'Swiss cheese plant', 'String of pearls', 'String of hearts',
            'Burros tail', 'Panda plant', 'Echeveria', 'Haworthia', 'Gasteria',
            // Succulents & Cacti
            'Succulent plant', 'Cactus', 'Aloe', 'Agave', 'Sedum', 'Sempervivum',
            'Lithops', 'Euphorbias', 'Adenium', 'Saguaro cactus', 'Prickly pear',
            'Christmas cactus', 'Easter cactus', 'Dragon tree', 'Tree aloe',
            'Barrel cactus', 'Golden barrel cactus', 'Peyote', 'San Pedro cactus',
            'Crassula ovata', 'Stapelia', 'Cotyledon', 'Graptopetalum', 'Kalanchoe',
            // Herbs & Culinary plants
            'Basil', 'Rosemary', 'Thyme', 'Mint', 'Oregano', 'Parsley', 'Cilantro',
            'Chives', 'Sage', 'Tarragon', 'Dill', 'Bay laurel', 'Lemon balm',
            'Lavender', 'Chamomile', 'Echinacea', 'St. John\'s wort', 'Valerian',
            'Peppermint', 'Spearmint', 'Lemon verbena', 'Fennel', 'Marjoram',
            'Catnip', 'Borage', 'Sorrel', 'Watercress', 'Stevia', 'Lemongrass',
            'Kaffir lime', 'Curry leaf', 'Turmeric', 'Ginger', 'Galangal',
            // Vegetables
            'Tomato', 'Cucumber', 'Bell pepper', 'Zucchini', 'Pumpkin', 'Squash',
            'Eggplant', 'Okra', 'Spinach', 'Lettuce', 'Kale', 'Cabbage', 'Broccoli',
            'Cauliflower', 'Brussels sprouts', 'Artichoke', 'Asparagus', 'Celery',
            'Carrot', 'Radish', 'Turnip', 'Beetroot', 'Sweet potato', 'Potato',
            'Onion', 'Garlic', 'Leek', 'Shallot', 'Corn', 'Pea', 'Green bean',
            'Broad bean', 'Soybean', 'Lentil', 'Chickpea', 'Sunflower', 'Quinoa',
            'Amaranth', 'Bok choy', 'Arugula', 'Radicchio', 'Endive', 'Swiss chard',
            // Fruits & Fruit trees
            'Apple', 'Pear', 'Plum', 'Cherry', 'Peach', 'Apricot', 'Nectarine',
            'Mango', 'Papaya', 'Banana', 'Pineapple', 'Coconut', 'Avocado',
            'Lime', 'Lemon', 'Orange', 'Grapefruit', 'Mandarin orange', 'Kumquat',
            'Fig', 'Pomegranate', 'Guava', 'Passion fruit', 'Lychee', 'Longan',
            'Rambutan', 'Durian', 'Jackfruit', 'Breadfruit', 'Starfruit',
            'Strawberry', 'Raspberry', 'Blueberry', 'Blackberry', 'Gooseberry',
            'Currant', 'Grape', 'Kiwifruit', 'Watermelon', 'Cantaloupe', 'Honeydew',
            // Flowering plants
            'Rose', 'Tulip', 'Sunflower', 'Daisy', 'Marigold', 'Chrysanthemum',
            'Lily', 'Iris', 'Orchid', 'Peony', 'Hydrangea', 'Dahlia', 'Zinnia',
            'Pansy', 'Viola', 'Petunia', 'Impatiens', 'Geranium', 'Fuchsia',
            'Begonia', 'Snapdragon', 'Foxglove', 'Hollyhock', 'Delphinium',
            'Lupine', 'Poppy', 'Cosmos', 'Aster', 'Coneflower', 'Black-eyed Susan',
            'Calla lily', 'Daylily', 'Hyacinth', 'Narcissus', 'Crocus', 'Gladiolus',
            'Wisteria', 'Bougainvillea', 'Jasmine', 'Gardenia', 'Magnolia',
            'Camellia', 'Azalea', 'Rhododendron', 'Hibiscus', 'Plumeria', 'Lantana',
            'Salvia', 'Verbena', 'Catmint', 'Agapanthus', 'Hellebore', 'Anemone',
            'Ranunculus', 'Allium', 'Freesia', 'Gerbera', 'Bird of paradise',
            'Protea', 'Strelitzia', 'Anthurium', 'Bromeliad', 'Tillandsia',
            'Statice', 'Baby\'s breath', 'Yarrow', 'Feverfew', 'Cornflower',
            // Trees
            'Oak', 'Maple', 'Elm', 'Ash tree', 'Birch', 'Beech', 'Willow',
            'Poplar', 'Linden', 'Walnut', 'Chestnut', 'Hazelnut', 'Hickory',
            'Alder', 'Sycamore', 'Plane tree', 'Cedar', 'Pine', 'Spruce', 'Fir',
            'Redwood', 'Cypress', 'Juniper', 'Hemlock', 'Larch', 'Douglas fir',
            'Eucalyptus', 'Acacia', 'Mimosa', 'Jacaranda', 'Baobab', 'Banyan',
            'Rubber tree', 'Teak', 'Mahogany', 'Ebony', 'Sandalwood', 'Bamboo',
            'Olive tree', 'Almond tree', 'Pistachio', 'Date palm', 'Coconut palm',
            'Royal palm', 'Fan palm', 'Sago palm', 'Cycad', 'Ginkgo biloba',
            'Elm tree', 'Cherry blossom', 'Dogwood', 'Redbud', 'Crabapple',
            'Hawthorn', 'Rowan', 'Elderberry', 'Mulberry', 'Persimmon', 'Jujube',
            // Shrubs
            'Lavender', 'Rosemary', 'Boxwood', 'Holly', 'Juniper bush', 'Yew',
            'Forsythia', 'Lilac', 'Viburnum', 'Spirea', 'Weigela', 'Deutzia',
            'Mock orange', 'Butterfly bush', 'Potentilla', 'Pieris', 'Leucothoe',
            'Nandina', 'Heavenly bamboo', 'Firethorn', 'Barberry', 'Mahonia',
            'Smokebush', 'Beautyberry', 'Chokeberry', 'Serviceberry', 'Itea',
            'Kerria', 'Quince', 'Witch hazel', 'Daphne', 'Skimmia', 'Callicarpa',
            // Tropical plants
            'Banana plant', 'Bird of paradise', 'Elephant ear', 'Canna lily',
            'Ginger lily', 'Heliconia', 'Brugmansia', 'Frangipani', 'Ylang ylang',
            'Hibiscus rosa-sinensis', 'Bougainvillea', 'Lantana camara',
            'Ixora', 'Plumeria rubra', 'Allamanda', 'Nerium oleander',
            'Tibouchina', 'Mussaenda', 'Costus', 'Alpinia', 'Zingiber',
            // Aquatic & bog plants
            'Water lily', 'Lotus', 'Water hyacinth', 'Cattail', 'Papyrus',
            'Water iris', 'Pickerelweed', 'Arrowhead plant', 'Hornwort',
            'Anacharis', 'Duckweed', 'Floating heart', 'Bog bean', 'Sundew',
            'Venus flytrap', 'Pitcher plant', 'Butterwort', 'Bladderwort',
            // Grasses & groundcovers
            'Bermuda grass', 'Kentucky bluegrass', 'Zoysia grass', 'Fescue',
            'Ryegrass', 'Buffalo grass', 'Centipede grass', 'St. Augustine grass',
            'Mondo grass', 'Liriope', 'Ajuga', 'Pachysandra', 'Vinca',
            'Creeping phlox', 'Sedum groundcover', 'Ice plant', 'Thyme groundcover',
            'Clover', 'Creeping thyme', 'Dichondra',
            // Ferns
            'Maidenhair fern', 'Boston fern', 'Bird\'s nest fern', 'Sword fern',
            'Holly fern', 'Ostrich fern', 'Royal fern', 'Cinnamon fern',
            'Interrupted fern', 'Sensitive fern', 'Autumn fern', 'Japanese fern',
            'Tree fern', 'Staghorn fern', 'Rabbit\'s foot fern', 'Button fern',
            // Vines & climbers
            'Clematis', 'Honeysuckle', 'Morning glory', 'Sweet pea', 'Nasturtium',
            'Virginia creeper', 'Boston ivy', 'Climbing hydrangea', 'Trumpet vine',
            'Passionflower', 'Moonflower', 'Black-eyed Susan vine', 'Cup and saucer vine',
            'Bougainvillea vine', 'Mandevilla', 'Dipladenia',
            // Native/Wildflowers
            'Wildflower', 'California poppy', 'Bluebonnet', 'Indian paintbrush',
            'Wild bergamot', 'Goldenrod', 'Joe-Pye weed', 'Wild columbine',
            'Shooting star', 'Trillium', 'Jack-in-the-pulpit', 'Bloodroot',
            'Wild ginger', 'Mayapple', 'Virginia bluebells', 'Blue-eyed grass',
            // Medicinal & special
            'Cannabis', 'Kratom', 'Kava', 'Ashwagandha', 'Ginseng', 'Astragalus',
            'Milk thistle', 'Elderflower', 'Feverfew', 'Valerian', 'Passionflower',
            'Lemon balm', 'Holy basil', 'Neem', 'Moringa', 'Hibiscus sabdariffa',
            'Cacao', 'Coffee plant', 'Tea plant', 'Vanilla', 'Saffron',
            // Specific popular species
            'Monstera adansonii', 'Monstera obliqua', 'Monstera dubia',
            'Pothos aureus', 'Neon pothos', 'Marble queen pothos',
            'Sansevieria trifasciata', 'Ficus lyrata', 'Ficus benjamina',
            'Cissus rhombifolia', 'Senecio rowleyanus', 'Ceropegia woodii',
            'Sedum morganianum', 'Kalanchoe tomentosa', 'Gasteria obliqua',
            'Aloe barbadensis', 'Aloe arborescens', 'Agave americana',
            'Opuntia', 'Echinocactus grusonii', 'Ferocactus', 'Mammillaria',
            'Cereus repandus', 'Echinopsis', 'Gymnocalycium', 'Parodia',
            'Paphiopedilum', 'Dendrobium', 'Phalaenopsis', 'Cattleya', 'Vanda',
            'Cymbidium', 'Oncidium', 'Epidendrum', 'Zygopetalum',
            'Rosa canina', 'Rosa damascena', 'Rosa gallica', 'Climbing rose',
            'Hybrid tea rose', 'Floribunda rose', 'Miniature rose', 'Shrub rose',
            'Lavandula angustifolia', 'Lavandula stoechas', 'French lavender',
            'Mentha piperita', 'Mentha spicata', 'Mentha aquatica',
            'Ocimum basilicum', 'Thai basil', 'Lemon basil', 'Purple basil',
            'Salvia officinalis', 'Salvia rosmarinus', 'Rosmarinus officinalis',
            'Thymus vulgaris', 'Thymus serpyllum', 'Lemon thyme',
            'Pelargonium', 'Scented geranium', 'Ivy geranium', 'Zonal geranium',
            'Impatiens walleriana', 'Impatiens hawkeri', 'New Guinea impatiens',
            'Viola wittrockiana', 'Viola tricolor', 'Viola odorata',
            'Helianthus annuus', 'Dwarf sunflower', 'Mammoth sunflower',
            'Zinnia elegans', 'Dahlia pinnata', 'Tagetes erecta', 'Tagetes patula',
            'Gypsophila paniculata', 'Ageratum', 'Lobelia erinus', 'Portulaca',
            'Vinca minor', 'Vinca major', 'Catharanthus roseus',
            'Dianthus', 'Carnation', 'Sweet William', 'Pinks',
            'Lisianthus', 'Eustoma', 'Gaillardia', 'Rudbeckia', 'Leucanthemum',
            'Solidago', 'Hemerocallis', 'Hosta', 'Astilbe', 'Bergenia',
            'Pulmonaria', 'Brunnera', 'Lamium', 'Ajuga reptans', 'Lysimachia',
            'Primrose', 'Primula', 'Polyanthus', 'Cowslip', 'Oxlip',
            'Cyclamen', 'Coleus', 'Caladium', 'Canna', 'Colocasia',
            'Xanthosoma', 'Amorphophallus', 'Arisaema', 'Zantedeschia',
            'Kniphofia', 'Tritonia', 'Crocosmia', 'Watsonia', 'Eucomis',
            'Ornithogalum', 'Scilla', 'Pushkinia', 'Chionodoxa',
            'Muscari', 'Galanthus', 'Leucojum', 'Eranthis', 'Anemone blanda',
            'Convallaria', 'Lily of the valley', 'Polygonatum', 'Solomon\'s seal',
            'Digitalis', 'Verbascum', 'Campanula', 'Platycodon', 'Lobelia cardinalis',
            'Penstemon', 'Gaura', 'Geum', 'Potentilla fruticosa', 'Trollius',
            'Baptisia', 'Thermopsis', 'Liatris', 'Echinops', 'Eryngium',
            'Acanthus', 'Dictamnus', 'Macleaya', 'Inula', 'Ligularia',
            'Knautia', 'Scabiosa', 'Centaurea', 'Tanacetum', 'Artemisia',
            'Salvia nemorosa', 'Agastache', 'Monarda', 'Phlomis', 'Stachys',
            'Nepeta', 'Teucrium', 'Origanum', 'Satureja', 'Hyssopus',
            'Sedum spectabile', 'Sedum telephium', 'Sedum album', 'Stonecrop',
            'Sempervivum tectorum', 'Hen and chicks', 'Aeonium', 'Dudleya',
            'Graptopetalum paraguayense', 'Ghost plant', 'Pachyphytum',
            'Adromischus', 'Crassula perforata', 'Crassula muscosa',
            'Euphorbia milii', 'Crown of thorns', 'Euphorbia tirucalli', 'Pencil cactus',
            'Sansevieria cylindrica', 'Sansevieria moonshine', 'Dracaena marginata',
            'Dracaena fragrans', 'Dracaena reflexa', 'Dracaena sanderiana',
            'Ficus elastica', 'Ficus pumila', 'Ficus microcarpa', 'Ficus carica',
            'Strelitzia reginae', 'Strelitzia nicolai', 'White bird of paradise',
            'Musa acuminata', 'Musa basjoo', 'Banana tree', 'Dwarf banana',
            'Heliconia rostrata', 'Heliconia bihai', 'Heliconia caribaea',
            'Alpinia purpurata', 'Costus speciosus', 'Zingiber officinale',
            'Curcuma longa', 'Curcuma alismatifolia', 'Siam tulip',
            'Plumeria obtusa', 'Plumeria pudica', 'White plumeria',
            'Gardenia jasminoides', 'Cape jasmine', 'Tiare gardenia',
            'Ixora coccinea', 'Ixora javanica', 'Jungle geranium',
        ];
    }

    public function handle(): int
    {
        $plants  = $this->plantList();
        $offset  = (int) $this->option('offset');
        $limit   = (int) $this->option('limit');
        $batch   = array_slice($plants, $offset, $limit);

        $imported = 0;
        $enriched = 0;
        $skipped  = 0;

        $this->info('Importing ' . count($batch) . ' popular plants from Wikipedia...');

        foreach ($batch as $plantName) {
            $data = $this->fetchWikipedia($plantName);
            if (!$data) { $skipped++; continue; }

            $existing = PlantEncyclopedia::where('name', $data['name'])
                ->orWhere('slug', Str::slug($data['name']))
                ->first();

            if ($existing) {
                $updates = [];
                if (!$existing->description && $data['description'])  $updates['description']   = $data['description'];
                if (empty($existing->images)  && !empty($data['images'])) $updates['images'] = $data['images'];
                if (!$existing->wikipedia_url && $data['wikipedia_url']) $updates['wikipedia_url'] = $data['wikipedia_url'];
                if ($updates) { $existing->update($updates); $enriched++; }
                else $skipped++;
                continue;
            }

            $slug = Str::slug($data['name']);
            $base = $slug; $c = 1;
            while (PlantEncyclopedia::where('slug', $slug)->exists()) $slug = $base . '-' . $c++;

            PlantEncyclopedia::create([
                'slug'            => $slug,
                'name'            => $data['name'],
                'scientific_name' => $data['scientific_name'],
                'description'     => $data['description'],
                'images'          => $data['images'],
                'wikipedia_url'   => $data['wikipedia_url'],
                'sources'         => ['wikipedia'],
            ]);
            $imported++;
            $this->line("  ✓ {$data['name']}");
            usleep(200000); // 200ms between requests to be polite
        }

        $this->info("\nDone — new: {$imported}, enriched: {$enriched}, not found: {$skipped}");
        return 0;
    }

    private function fetchWikipedia(string $name): ?array
    {
        try {
            // Use the REST summary API — fast, returns clean data
            $slug = str_replace(' ', '_', $name);
            $res  = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'GreenyCornerBot/1.0 (greenycorner.ae plant encyclopedia)'])
                ->get("https://en.wikipedia.org/api/rest_v1/page/summary/{$slug}");

            if ($res->status() === 404) return null;
            if (!$res->successful()) return null;

            $d = $res->json();
            if (($d['type'] ?? '') === 'disambiguation') return null;

            $extract = $d['extract'] ?? '';
            if (strlen($extract) < 40) return null;

            // Verify it's plant-related
            $lc = strtolower($extract . ' ' . ($d['description'] ?? ''));
            $plantWords = ['plant', 'species', 'genus', 'family', 'flower', 'tree', 'herb', 'shrub', 'leaf', 'botanical', 'grow', 'native', 'cultivar', 'variety', 'perennial', 'annual', 'grass', 'vine', 'fruit', 'vegetable', 'root', 'stem', 'bloom', 'blossom', 'foliage', 'succulent', 'cactus', 'palm', 'fern'];
            $isPlant = false;
            foreach ($plantWords as $w) { if (str_contains($lc, $w)) { $isPlant = true; break; } }
            if (!$isPlant) return null;

            $title = $d['title'] ?? $name;
            $image = $d['originalimage']['source'] ?? $d['thumbnail']['source'] ?? null;

            // Try to extract scientific name from description or extract
            $scientificName = null;
            $desc = $d['description'] ?? '';
            if (preg_match('/^([A-Z][a-z]+ [a-z]+(?:\s[a-z]+)?)/', $desc, $m)) {
                $scientificName = $m[1];
            } elseif (preg_match('/\b([A-Z][a-z]+ [a-z]+(?:\s[a-z]+)?)\b/', $extract, $m)) {
                $scientificName = $m[1];
            }

            return [
                'name'            => $title,
                'scientific_name' => $scientificName,
                'description'     => trim(preg_replace('/\s+/', ' ', $d['extract'])),
                'images'          => $image ? [$image] : [],
                'wikipedia_url'   => $d['content_urls']['desktop']['page'] ?? "https://en.wikipedia.org/wiki/{$slug}",
            ];
        } catch (\Exception) {
            return null;
        }
    }
}
