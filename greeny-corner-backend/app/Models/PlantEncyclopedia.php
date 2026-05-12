<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class PlantEncyclopedia extends Model
{
    protected $table = 'plant_encyclopedia';

    protected $fillable = [
        'slug',
        'name',
        'name_ar',
        'scientific_name',
        'family',
        'genus',
        'origin',
        'description',
        'description_ar',
        'common_names',
        'care_info',
        'growth_info',
        'benefits',
        'interesting_facts',
        'toxicity',
        'images',
        'perenual_id',
        'gbif_id',
        'wikipedia_url',
        'sources',
        'is_featured',
        'view_count',
    ];

    protected $casts = [
        'common_names'     => 'array',
        'care_info'        => 'array',
        'growth_info'      => 'array',
        'benefits'         => 'array',
        'interesting_facts'=> 'array',
        'images'           => 'array',
        'sources'          => 'array',
        'is_featured'      => 'boolean',
    ];

    public function getMainImageAttribute(): ?string
    {
        return $this->images[0] ?? null;
    }

    public function getSummaryAttribute(): string
    {
        if (!$this->description) return '';
        return mb_substr(strip_tags($this->description), 0, 200);
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('scientific_name', 'like', "%{$term}%")
              ->orWhere('family', 'like', "%{$term}%");
        });
    }
}
