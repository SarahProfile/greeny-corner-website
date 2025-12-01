<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Plant extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'image_url',
        'api_data',
        'added_at',
        'scientific_name',
        'perenual_id',
        'plant_data_en',
        'plant_data_ar',
        'gemini_data_fetched',
        'gemini_fetched_at',
        'diseases_info',
        'nutrition_info',
    ];

    protected $casts = [
        'api_data' => 'array',
        'plant_data_en' => 'array',
        'plant_data_ar' => 'array',
        'diseases_info' => 'array',
        'nutrition_info' => 'array',
        'added_at' => 'datetime',
        'gemini_fetched_at' => 'datetime',
        'gemini_data_fetched' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function careSchedule(): HasOne
    {
        return $this->hasOne(CareSchedule::class);
    }

    public function getImageUrlAttribute($value)
    {
        // If the image_url starts with http, return as is
        if (str_starts_with($value, 'http')) {
            return $value;
        }
        
        // If it starts with /storage, prepend the APP_URL
        if (str_starts_with($value, '/storage')) {
            return url($value);
        }
        
        // Otherwise return the original value
        return $value;
    }
}
