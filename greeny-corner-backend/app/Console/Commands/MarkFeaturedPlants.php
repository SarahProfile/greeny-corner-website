<?php

namespace App\Console\Commands;

use App\Models\PlantEncyclopedia;
use Illuminate\Console\Command;

class MarkFeaturedPlants extends Command
{
    protected $signature = 'plants:mark-featured {--limit=50 : How many plants to feature}';
    protected $description = 'Mark the most complete plant entries as featured for the home page';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');

        PlantEncyclopedia::query()->update(['is_featured' => false]);

        $count = PlantEncyclopedia::whereNotNull('description')
            ->whereNotNull('images')
            ->whereNotNull('care_info')
            ->whereNotNull('scientific_name')
            ->orderByDesc('view_count')
            ->limit($limit)
            ->update(['is_featured' => true]);

        $actual = PlantEncyclopedia::where('is_featured', true)->count();
        $this->info("Marked {$actual} plants as featured.");
        return 0;
    }
}
