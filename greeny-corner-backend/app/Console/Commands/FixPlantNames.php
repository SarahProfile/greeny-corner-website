<?php

namespace App\Console\Commands;

use App\Models\CareSchedule;
use App\Models\Plant;
use App\Services\PlantNameService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class FixPlantNames extends Command
{
    protected $signature = 'plants:fix-names
                            {--dry-run : Only report what would change}
                            {--limit=0 : Maximum number of plants to process (0 = all)}';

    protected $description = 'Backfill English + Arabic common names for saved plants (replaces scientific / wrong-language names) and fertilizing schedules';

    public function handle(PlantNameService $names): int
    {
        $dry = (bool) $this->option('dry-run');
        $limit = (int) $this->option('limit');

        $query = Plant::with('careSchedule')->orderBy('id');
        if ($limit > 0) {
            $query->limit($limit);
        }
        $plants = $query->get();

        $fixed = 0;
        $scheduled = 0;

        foreach ($plants as $plant) {
            $apiData = is_array($plant->api_data) ? $plant->api_data : [];
            $sci = $plant->scientific_name ?: ($apiData['scientific_name'] ?? '');
            $needsName = PlantNameService::isScientific($plant->name, $sci)
                || PlantNameService::hasArabic($plant->name)
                || !PlantNameService::hasArabic($apiData['name_ar'] ?? null);

            if ($needsName) {
                $before = $plant->name;
                if ($dry) {
                    $this->line("would fix #{$plant->id}: {$before}");
                } elseif ($names->fixPlant($plant, true, false)) {
                    $plant->refresh();
                    $this->line("#{$plant->id}: {$before} -> {$plant->name} / " . ($plant->api_data['name_ar'] ?? '—'));
                    $fixed++;
                }
            }

            $schedule = $plant->careSchedule;
            if ($schedule && !$schedule->next_fertilizing_date) {
                $interval = (int) ($schedule->fertilizing_interval_days ?: 30);
                if (!$dry) {
                    $schedule->update([
                        'fertilizing_interval_days' => $interval,
                        'next_fertilizing_date' => Carbon::now()->addDays($interval),
                    ]);
                }
                $scheduled++;
            }
        }

        $this->info(($dry ? '[dry-run] ' : '') . "Names processed: {$fixed}; fertilizing schedules created: {$scheduled}; plants scanned: {$plants->count()}");
        return self::SUCCESS;
    }
}
