<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Plant;
use App\Models\CareSchedule;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::create([
            'name' => 'Demo User',
            'email' => 'demo@greeny-corner.com',
            'password' => Hash::make('password123'),
        ]);

        $plant1 = Plant::create([
            'user_id' => $user->id,
            'name' => 'Fiddle Leaf Fig',
            'image_url' => '/storage/plants/demo-fiddle-leaf.jpg',
            'api_data' => [
                'name' => 'Fiddle Leaf Fig',
                'confidence' => 0.95,
                'common_names' => ['Fiddle Leaf Fig', 'Ficus lyrata'],
            ],
            'added_at' => Carbon::now()->subDays(10),
        ]);

        CareSchedule::create([
            'plant_id' => $plant1->id,
            'watering_interval_days' => 7,
            'next_watering_date' => Carbon::now()->addDays(4),
        ]);

        $plant2 = Plant::create([
            'user_id' => $user->id,
            'name' => 'Snake Plant',
            'image_url' => '/storage/plants/demo-snake-plant.jpg',
            'api_data' => [
                'name' => 'Snake Plant',
                'confidence' => 0.88,
                'common_names' => ['Snake Plant', 'Sansevieria trifasciata', 'Mother-in-law\'s tongue'],
            ],
            'added_at' => Carbon::now()->subDays(5),
        ]);

        CareSchedule::create([
            'plant_id' => $plant2->id,
            'watering_interval_days' => 14,
            'next_watering_date' => Carbon::now()->addDays(9),
        ]);
    }
}
