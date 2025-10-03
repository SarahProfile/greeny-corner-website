<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CareSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'plant_id',
        'watering_interval_days',
        'next_watering_date',
        'fertilizing_interval_days',
        'next_fertilizing_date',
        'tilling_interval_days',
        'next_tilling_date',
        'last_watered_date',
        'last_fertilized_date',
        'last_tilled_date',
        'watering_notifications_enabled',
        'fertilizing_notifications_enabled',
        'tilling_notifications_enabled',
    ];

    protected $casts = [
        'next_watering_date' => 'datetime',
        'next_fertilizing_date' => 'datetime',
        'next_tilling_date' => 'datetime',
        'last_watered_date' => 'datetime',
        'last_fertilized_date' => 'datetime',
        'last_tilled_date' => 'datetime',
        'watering_notifications_enabled' => 'boolean',
        'fertilizing_notifications_enabled' => 'boolean',
        'tilling_notifications_enabled' => 'boolean',
    ];

    public function plant(): BelongsTo
    {
        return $this->belongsTo(Plant::class);
    }
}
