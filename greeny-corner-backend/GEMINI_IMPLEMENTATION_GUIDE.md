# Gemini Plant Identification Implementation Guide

## Overview
This guide explains how to implement the new plant identification system that uses:
1. **PlantNet API** - Extract plant name only (scientific + common name)
2. **Gemini AI** - Generate full bilingual plant details (English + Arabic)
3. **Database Caching** - Store data to avoid repeated API calls

---

## Backend Implementation

### 1. Database Migration

File: `database/migrations/2025_11_28_075016_add_bilingual_fields_to_plants_table.php`

✅ Already created - Run migration when ready:
```bash
php artisan migrate
```

### 2. Plant Model Updates

File: `app/Models/Plant.php`

✅ Already updated with new fields:
- `plant_data_en` (JSON)
- `plant_data_ar` (JSON)
- `gemini_data_fetched` (boolean)
- `gemini_fetched_at` (timestamp)

### 3. Gemini Service

File: `app/Services/GeminiService.php`

✅ Already created

### 4. Environment Configuration

Add to `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

### 5. PlantController Methods

File: `app/Http/Controllers/API/PlantControllerGeminiMethods.php`

⚠️ **ACTION REQUIRED**: Copy these methods to your `PlantController.php`:

```php
// Add to PlantController class:
use App\Services\GeminiService;

public function getPlantByName(Request $request) { ... }
public function identifyWithGemini(Request $request) { ... }
private function identifyWithPlantNetOnly($imagePath): ?array { ... }
public function refreshGeminiData($id) { ... }
```

Full code is in: `app/Http/Controllers/API/PlantControllerGeminiMethods.php`

### 6. API Routes

File: `routes/api.php`

✅ Already added:
- `GET /api/plants/by-name?name=Ficus-lyrata&lang=ar`
- `POST /api/plants/identify-gemini` (authenticated)
- `PUT /api/plants/{id}/refresh-gemini` (authenticated)

---

## Frontend Implementation

### 1. API Client Functions

Create/Update: `greeny-corner-frontend/src/lib/api.ts` or `api.js`

```typescript
// Add these functions to your API client

/**
 * Get plant data by name with language support
 */
export async function getPlantByName(plantName: string, language: 'en' | 'ar' = 'en') {
  const response = await fetch(
    `${API_BASE_URL}/plants/by-name?name=${encodeURIComponent(plantName)}&lang=${language}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch plant data');
  }
  
  return response.json();
}

/**
 * Identify plant using image with Gemini integration
 */
export async function identifyPlantWithGemini(imageFile: File, language: 'en' | 'ar' = 'en') {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('language', language);
  
  const token = localStorage.getItem('auth_token'); // or however you store token
  
  const response = await fetch(`${API_BASE_URL}/plants/identify-gemini`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to identify plant');
  }
  
  return response.json();
}

/**
 * Refresh Gemini data for a plant
 */
export async function refreshPlantGeminiData(plantId: number) {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_BASE_URL}/plants/${plantId}/refresh-gemini`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to refresh plant data');
  }
  
  return response.json();
}
```

### 2. Plant Detail Component

Create: `greeny-corner-frontend/src/app/plant-details/[slug]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getPlantByName } from '@/lib/api';

interface PlantData {
  description: string;
  watering: string;
  sunlight: string;
  soil: string;
  temperature: string;
  climate: string;
  diseases: string;
  pests: string;
  propagation: string;
  pruning: string;
  toxicity: string;
  care_tips: string;
}

export default function PlantDetailPage() {
  const params = useParams();
  const { i18n } = useTranslation();
  const [plantData, setPlantData] = useState<PlantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const plantSlug = params.slug as string;
  const currentLang = i18n.language as 'en' | 'ar';

  useEffect(() => {
    async function fetchPlantData() {
      try {
        setLoading(true);
        const response = await getPlantByName(plantSlug, currentLang);
        
        if (response.success) {
          setPlantData(response.data.plant_data);
        } else {
          setError(response.message || 'Failed to load plant data');
        }
      } catch (err) {
        setError('An error occurred while fetching plant data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlantData();
  }, [plantSlug, currentLang]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading plant details...</div>
      </div>
    );
  }

  if (error || !plantData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error || 'Plant not found'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{plantSlug.replace(/-/g, ' ')}</h1>

      {/* Description */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Description</h2>
        <p className="text-gray-700 leading-relaxed">{plantData.description}</p>
      </section>

      {/* Care Requirements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Watering */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2 flex items-center">
            <span className="mr-2">💧</span> Watering
          </h3>
          <p className="text-gray-700">{plantData.watering}</p>
        </div>

        {/* Sunlight */}
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2 flex items-center">
            <span className="mr-2">☀️</span> Sunlight
          </h3>
          <p className="text-gray-700">{plantData.sunlight}</p>
        </div>

        {/* Soil */}
        <div className="bg-amber-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2 flex items-center">
            <span className="mr-2">🌱</span> Soil
          </h3>
          <p className="text-gray-700">{plantData.soil}</p>
        </div>

        {/* Temperature */}
        <div className="bg-red-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2 flex items-center">
            <span className="mr-2">🌡️</span> Temperature
          </h3>
          <p className="text-gray-700">{plantData.temperature}</p>
        </div>
      </div>

      {/* Climate */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Climate</h2>
        <p className="text-gray-700">{plantData.climate}</p>
      </section>

      {/* Propagation */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Propagation</h2>
        <p className="text-gray-700">{plantData.propagation}</p>
      </section>

      {/* Pruning */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Pruning</h2>
        <p className="text-gray-700">{plantData.pruning}</p>
      </section>

      {/* Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Diseases */}
        <div className="bg-orange-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Common Diseases</h3>
          <p className="text-gray-700">{plantData.diseases}</p>
        </div>

        {/* Pests */}
        <div className="bg-red-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Common Pests</h3>
          <p className="text-gray-700">{plantData.pests}</p>
        </div>
      </div>

      {/* Toxicity Warning */}
      {plantData.toxicity && (
        <section className="mb-8 bg-amber-100 border-l-4 border-amber-500 p-6">
          <h2 className="text-2xl font-semibold mb-3 text-amber-900">⚠️ Safety Information</h2>
          <p className="text-gray-800">{plantData.toxicity}</p>
        </section>
      )}

      {/* Care Tips */}
      <section className="mb-8 bg-green-50 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-3">💡 Care Tips</h2>
        <p className="text-gray-700 leading-relaxed">{plantData.care_tips}</p>
      </section>
    </div>
  );
}
```

---

## Testing the Implementation

### 1. Test Gemini API Connection

```php
// In tinker or a test route
$gemini = app(\App\Services\GeminiService::class);
$data = $gemini->getPlantDetails('Monstera Deliciosa', 'en');
dd($data);
```

### 2. Test Plant Identification Flow

```bash
# Upload a plant image
curl -X POST http://localhost:8000/api/plants/identify-gemini \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@plant.jpg" \
  -F "language=en"
```

### 3. Test Plant Data Retrieval

```bash
# Get plant by name in Arabic
curl "http://localhost:8000/api/plants/by-name?name=Monstera-Deliciosa&lang=ar"

# Get plant by name in English
curl "http://localhost:8000/api/plants/by-name?name=Monstera-Deliciosa&lang=en"
```

---

## Deployment Checklist

- [ ] Run database migration: `php artisan migrate`
- [ ] Add Gemini API key to production `.env`
- [ ] Add PlantController methods from `PlantControllerGeminiMethods.php`
- [ ] Test PlantNet API is working (add PLANTNET_API_KEY if needed)
- [ ] Update frontend API client with new functions
- [ ] Create plant detail page component
- [ ] Test end-to-end flow in development
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Monitor Gemini API usage and costs

---

## API Response Examples

### Get Plant By Name (English)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Monstera Deliciosa",
    "scientific_name": "Monstera deliciosa",
    "image_url": "https://...",
    "plant_data": {
      "description": "Monstera deliciosa is a tropical plant...",
      "watering": "Water when top 2 inches of soil are dry...",
      "sunlight": "Bright, indirect light...",
      "soil": "Well-draining potting mix...",
      "temperature": "18-27°C (65-80°F)...",
      "climate": "Warm, humid tropical climate...",
      "diseases": "Root rot, leaf spot...",
      "pests": "Spider mites, mealybugs...",
      "propagation": "Stem cuttings, air layering...",
      "pruning": "Remove dead leaves...",
      "toxicity": "Toxic to pets if ingested...",
      "care_tips": "Provide moss pole for climbing..."
    },
    "language": "en"
  }
}
```

### Get Plant By Name (Arabic)
Same structure, but all text fields in Arabic.

---

## Cost Considerations

**Gemini API Pricing** (as of 2024):
- Free tier: 60 requests per minute
- Characters per request: ~2000-3000
- Estimated cost per plant: $0.001 - $0.005

**Optimization Strategy:**
- Cache data in database (✅ implemented)
- Only call Gemini once per unique plant
- Reuse cached data for all users

---

## Notes

1. **PlantNet API** is used ONLY for identifying the plant name
2. **Gemini AI** generates ALL detailed information
3. Data is stored in **both languages** simultaneously
4. **No re-fetching** for plants already in database
5. Users can **refresh** data if needed via API

---

## Support

For issues or questions, check:
- Laravel logs: `storage/logs/laravel.log`
- Gemini API docs: https://ai.google.dev/docs
- PlantNet API docs: https://my.plantnet.org/
