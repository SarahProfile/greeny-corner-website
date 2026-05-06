<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\PlantEncyclopedia;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PlantEncyclopediaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $limit = min((int) ($request->limit ?? 24), 100);
        $query = PlantEncyclopedia::query();

        if ($request->filled('q')) {
            $query->search($request->q);
        }
        if ($request->filled('family')) {
            $query->where('family', $request->family);
        }
        if ($request->filled('genus')) {
            $query->where('genus', $request->genus);
        }
        if ($request->boolean('featured')) {
            $query->featured();
        }

        $results = $query->orderByDesc('is_featured')
            ->orderByDesc('view_count')
            ->paginate($limit);

        return response()->json([
            'data'         => $results->map(fn($p) => $this->toListItem($p)),
            'total'        => $results->total(),
            'current_page' => $results->currentPage(),
            'last_page'    => $results->lastPage(),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $plant = PlantEncyclopedia::where('slug', $slug)->first();

        if (!$plant) {
            return response()->json(['message' => 'Plant not found'], 404);
        }

        $plant->increment('view_count');

        return response()->json($plant);
    }

    public function search(Request $request): JsonResponse
    {
        $q = trim($request->q ?? '');

        if (strlen($q) < 2) {
            return response()->json([]);
        }

        $results = PlantEncyclopedia::search($q)
            ->limit(10)
            ->get()
            ->map(fn($p) => [
                'id'              => $p->id,
                'slug'            => $p->slug,
                'name'            => $p->name,
                'scientific_name' => $p->scientific_name,
                'image'           => $p->main_image,
            ]);

        return response()->json($results);
    }

    public function featured(): JsonResponse
    {
        $plants = PlantEncyclopedia::featured()
            ->whereNotNull('images')
            ->orderByDesc('view_count')
            ->limit(12)
            ->get()
            ->map(fn($p) => $this->toListItem($p));

        return response()->json($plants);
    }

    public function families(): JsonResponse
    {
        $families = PlantEncyclopedia::select('family')
            ->distinct()
            ->whereNotNull('family')
            ->orderBy('family')
            ->pluck('family');

        return response()->json($families);
    }

    public function similar(string $slug): JsonResponse
    {
        $plant = PlantEncyclopedia::where('slug', $slug)->first();

        if (!$plant) {
            return response()->json([]);
        }

        $query = PlantEncyclopedia::where('id', '!=', $plant->id);

        if ($plant->family) {
            $query->where('family', $plant->family);
        } else {
            $query->where('genus', $plant->genus);
        }

        $similar = $query->whereNotNull('images')
            ->limit(6)
            ->get()
            ->map(fn($p) => [
                'id'              => $p->id,
                'slug'            => $p->slug,
                'name'            => $p->name,
                'scientific_name' => $p->scientific_name,
                'image'           => $p->main_image,
                'family'          => $p->family,
            ]);

        return response()->json($similar);
    }

    // Endpoint for sitemap generation — lightweight, returns slug + updated_at only
    public function slugs(Request $request): JsonResponse
    {
        $page  = max(1, (int) ($request->page ?? 1));
        $limit = min((int) ($request->limit ?? 500), 1000);

        $results = PlantEncyclopedia::select('slug', 'updated_at')
            ->orderBy('id')
            ->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'data'      => $results->items(),
            'last_page' => $results->lastPage(),
        ]);
    }

    private function toListItem(PlantEncyclopedia $p): array
    {
        $careInfo = $p->care_info ?? [];
        return [
            'id'              => $p->id,
            'slug'            => $p->slug,
            'name'            => $p->name,
            'scientific_name' => $p->scientific_name,
            'family'          => $p->family,
            'image'           => $p->main_image,
            'is_featured'     => $p->is_featured,
            'care_info'       => [
                'watering_interval_days' => $careInfo['watering_interval_days'] ?? null,
                'light'                  => $careInfo['light'] ?? null,
                'difficulty'             => $careInfo['difficulty'] ?? null,
            ],
        ];
    }
}
