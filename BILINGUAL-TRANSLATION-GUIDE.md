# Complete Bilingual Translation System Guide

## English ↔ Arabic Translation for Next.js + Laravel

This guide covers the complete implementation of automatic translation between English and Arabic for both static UI text and dynamic API content.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Setup (Next.js)](#frontend-setup-nextjs)
3. [Backend Setup (Laravel)](#backend-setup-laravel)
4. [Usage Examples](#usage-examples)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## System Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                    │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ i18next Config   │◄────────│ Translation      │         │
│  │ (static UI)      │         │ JSON Files       │         │
│  └──────────────────┘         └──────────────────┘         │
│           │                             │                    │
│           │        ┌────────────────────┘                   │
│           ▼        ▼                                         │
│  ┌──────────────────────────────┐                          │
│  │   Language Switcher          │                          │
│  │   (RTL/LTR + Reload)         │                          │
│  └──────────────────────────────┘                          │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────────────────┐                          │
│  │   API Calls with lang param  │                          │
│  └──────────────────────────────┘                          │
└─────────────────│────────────────────────────────────────────┘
                  │
                  │ HTTP (lang=en|ar)
                  │
┌─────────────────▼────────────────────────────────────────────┐
│                    BACKEND (Laravel)                         │
│                                                              │
│  ┌──────────────────────────────┐                          │
│  │   PlantController            │                          │
│  │   (receives lang param)      │                          │
│  └──────────────────────────────┘                          │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────────────────┐                          │
│  │   PlantNet API Call          │                          │
│  │   (gets English response)    │                          │
│  └──────────────────────────────┘                          │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────────────────┐                          │
│  │   TranslationService         │                          │
│  │   (Google Translate)         │                          │
│  └──────────────────────────────┘                          │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────────────────┐                          │
│  │   Return Translated JSON     │                          │
│  └──────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Features

✅ **Static UI Translation** - All buttons, labels, and text in UI
✅ **Dynamic API Translation** - PlantNet API responses
✅ **RTL Support** - Automatic right-to-left layout for Arabic
✅ **Language Persistence** - Saves user preference in localStorage
✅ **Cached Translations** - Laravel caches translations for 30 days
✅ **Smart Translation** - Preserves scientific names, URLs, IDs

---

## Frontend Setup (Next.js)

### 1. Configuration Files

#### `next-i18next.config.js` (Already configured)

```javascript
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar'],
  },
  fallbackLng: {
    default: ['en'],
  },
  debug: process.env.NODE_ENV === 'development',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
}
```

#### `src/lib/i18n.ts` (Already configured)

Contains all translation resources with nested structure:
- `common.auth.*` - Authentication text
- `common.navigation.*` - Navigation items
- `common.plants.*` - Plant-related text
- `common.addPlant.*` - Add plant page text
- etc.

### 2. Translation Hook Usage

Use the `useTranslation` hook in any component:

```typescript
'use client';

import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>Current language: {i18n.language}</p>
      <button>{t('plants.addPlant')}</button>
    </div>
  );
}
```

### 3. Language Switcher Component

Already implemented at `src/components/LanguageSwitcher.tsx`:

```typescript
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = async (locale: string) => {
    i18n.changeLanguage(locale);
    localStorage.setItem('language', locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';

    // Refresh plant data if user is authenticated
    if (user) {
      await plantsAPI.refreshPlantsLanguage(locale);
    }
  };

  // ... dropdown UI
}
```

### 4. API Integration

The `src/lib/api.ts` already includes language support:

```typescript
export const plantsAPI = {
  // Add plant with language
  addPlant: async (image: File, language?: string) => {
    const formData = new FormData();
    formData.append('image', image);

    const currentLanguage = language ||
                           localStorage.getItem('language') ||
                           'en';
    formData.append('language', currentLanguage);

    const response = await api.post<Plant>('/plants', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Refresh all plants when language changes
  refreshPlantsLanguage: async (language: string) => {
    const response = await api.post('/plants/refresh-language', { language });
    return response.data;
  },
};
```

### 5. Adding Translation Keys

To add new translations, update both language files:

**`public/locales/en/common.json`:**
```json
{
  "myNewSection": {
    "title": "My Title",
    "description": "My description text"
  }
}
```

**`public/locales/ar/common.json`:**
```json
{
  "myNewSection": {
    "title": "عنواني",
    "description": "نص الوصف الخاص بي"
  }
}
```

---

## Backend Setup (Laravel)

### 1. Install Google Translate Package

Run this command in your Laravel backend directory:

```bash
cd greeny-corner-backend
composer require stichoza/google-translate-php
```

### 2. Translation Service

Already created at `app/Services/TranslationService.php`:

#### Key Methods:

**`translate(string $text, string $targetLang)`**
- Translates a single string
- Caches results for 30 days
- Returns original text if translation fails

**`translateArray(array $texts, string $targetLang)`**
- Translates array of strings
- Preserves array keys

**`translateDeep($data, string $targetLang, array $excludeKeys)`**
- Recursively translates nested arrays/objects
- Skips specified keys (scientific names, URLs, etc.)

**`translatePlantData(array $plantData, string $targetLang)`**
- Specialized for plant API responses
- Automatically excludes: scientific_name, image_url, id, confidence, etc.
- Perfect for PlantNet API responses

#### Example Usage:

```php
use App\Services\TranslationService;

class MyController extends Controller
{
    protected $translationService;

    public function __construct(TranslationService $translationService)
    {
        $this->translationService = $translationService;
    }

    public function translateExample()
    {
        // Simple translation
        $text = "Hello, world!";
        $arabic = $this->translationService->translate($text, 'ar');
        // Result: "مرحبا بالعالم!"

        // Translate plant data
        $plantData = [
            'name' => 'Pothos',
            'scientific_name' => 'Epipremnum aureum',  // Won't be translated
            'description' => 'Easy to care for indoor plant',
            'care_info' => [
                'light' => 'Bright indirect light',
                'watering' => 'Water when top soil is dry'
            ]
        ];

        $arabicPlant = $this->translationService->translatePlantData($plantData, 'ar');
        // Result:
        // [
        //   'name' => 'بوتس',
        //   'scientific_name' => 'Epipremnum aureum',  // Unchanged
        //   'description' => 'نبات داخلي سهل العناية',
        //   'care_info' => [
        //     'light' => 'ضوء غير مباشر ساطع',
        //     'watering' => 'اسقِ عندما تجف التربة العليا'
        //   ]
        // ]
    }
}
```

### 3. PlantController Integration

The controller now automatically translates PlantNet API responses:

```php
// app/Http/Controllers/API/PlantController.php

public function store(Request $request)
{
    // ... file validation ...

    // Get language from request
    $language = $request->input('language', 'en');

    // Identify plant (will auto-translate based on language)
    $plantData = $this->identifyPlant($imagePath, $language);

    // Save plant with translated data
    $plant = Plant::create([
        'user_id' => $request->user()->id,
        'name' => $plantData['name'],
        'api_data' => $plantData,  // Contains translated content
        // ...
    ]);

    return response()->json($plant, 201);
}

private function identifyPlant($imagePath, $language = 'en')
{
    // Call PlantNet API (returns English)
    $result = $this->identifyWithPlantNet($imagePath);

    // Translate to target language
    return $this->translatePlantData($result, $language);
}

private function translatePlantData($plantData, $targetLanguage)
{
    if ($targetLanguage === 'en') {
        return $plantData;
    }

    // Use TranslationService for automatic translation
    return $this->translationService->translatePlantData($plantData, $targetLanguage);
}
```

### 4. API Routes

Already configured in `routes/api.php`:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::resource('plants', PlantController::class);
    Route::post('plants/refresh-language', [PlantController::class, 'refreshPlantsLanguage']);
});
```

---

## Usage Examples

### Example 1: User Adds a Plant in Arabic

**Frontend Flow:**

1. User selects Arabic from language switcher
2. Language is saved to localStorage
3. User uploads plant image
4. Frontend calls API with `language=ar`

```typescript
// add-plant/page.tsx
const handleSubmit = async (image: File) => {
  const currentLang = localStorage.getItem('language') || 'en';
  const plant = await plantsAPI.addPlant(image, currentLang);
  // plant.api_data contains Arabic translations
};
```

**Backend Flow:**

1. Laravel receives image + `language=ar`
2. Calls PlantNet API (gets English response)
3. TranslationService translates all text to Arabic
4. Returns Arabic plant data to frontend

**Response Example:**

```json
{
  "id": 123,
  "name": "بوتس",
  "scientific_name": "Epipremnum aureum",
  "api_data": {
    "name": "بوتس",
    "common_names": ["بوتس", "نبات المال"],
    "description": "نبات داخلي شهير سهل العناية به",
    "care_info": {
      "light": "ضوء غير مباشر ساطع",
      "watering": "اسقِ عندما تجف التربة العليا",
      "temperature": "18-24 درجة مئوية"
    }
  }
}
```

### Example 2: User Switches Language

**Frontend Flow:**

```typescript
// LanguageSwitcher.tsx
const changeLanguage = async (locale: string) => {
  // 1. Update i18n
  i18n.changeLanguage(locale);

  // 2. Update localStorage
  localStorage.setItem('language', locale);

  // 3. Update HTML attributes
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';

  // 4. Refresh plant data if authenticated
  if (user) {
    await plantsAPI.refreshPlantsLanguage(locale);
  }

  // 5. Reload page to apply RTL/LTR styles
  window.location.reload();
};
```

**Backend Flow:**

```php
// PlantController@refreshPlantsLanguage
public function refreshPlantsLanguage(Request $request)
{
    $language = $request->input('language');
    $plants = $request->user()->plants()->get();

    foreach ($plants as $plant) {
        if ($plant->api_data) {
            $translatedData = $this->translatePlantData($plant->api_data, $language);
            $plant->update(['api_data' => $translatedData]);
        }
    }

    return response()->json(['message' => 'Plants refreshed successfully']);
}
```

### Example 3: Display Plant Details

**Frontend:**

```typescript
'use client';

import { useTranslation } from 'react-i18next';

export default function PlantDetail({ plant }) {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{plant.name}</h1>
      <p className="italic">{plant.scientific_name}</p>

      <div>
        <h2>{t('plantDetail.careRequirements')}</h2>
        <p><strong>{t('plantDetail.light')}:</strong> {plant.api_data.care_info.light}</p>
        <p><strong>{t('plantDetail.watering')}:</strong> {plant.api_data.care_info.watering}</p>
      </div>

      <p>{plant.api_data.description}</p>
    </div>
  );
}
```

**Result in English:**
```
Pothos
Epipremnum aureum

Care Requirements
Light: Bright indirect light
Watering: Water when top soil is dry

Easy to care for indoor plant
```

**Result in Arabic (RTL layout):**
```
بوتس
Epipremnum aureum

متطلبات الرعاية
الضوء: ضوء غير مباشر ساطع
الري: اسقِ عندما تجف التربة العليا

نبات داخلي سهل العناية به
```

---

## Testing

### Frontend Testing

1. **Test Language Switcher:**
   ```bash
   cd greeny-corner-frontend
   npm run dev
   ```
   - Visit http://localhost:3000
   - Click language switcher
   - Verify UI text changes
   - Verify RTL/LTR layout changes

2. **Test Static Translations:**
   - Check all pages for correct translations
   - Verify navigation items
   - Check button labels
   - Verify form placeholders

3. **Test API Integration:**
   - Add a plant in English
   - Switch to Arabic
   - Add another plant
   - Verify both show correct language data

### Backend Testing

1. **Test Translation Service:**
   ```php
   php artisan tinker

   $service = new \App\Services\TranslationService();
   $result = $service->translate('Hello World', 'ar');
   echo $result; // Should output: مرحبا بالعالم
   ```

2. **Test Plant Identification:**
   ```bash
   # Using curl or Postman
   curl -X POST http://localhost:8000/api/plants \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "image=@plant.jpg" \
     -F "language=ar"
   ```

3. **Test Language Refresh:**
   ```bash
   curl -X POST http://localhost:8000/api/plants/refresh-language \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"language": "ar"}'
   ```

### Manual Testing Checklist

- [ ] Language switcher visible on all pages
- [ ] Switching language changes UI text immediately
- [ ] RTL layout applied when Arabic is selected
- [ ] LTR layout applied when English is selected
- [ ] Language preference persists after page reload
- [ ] Plant identification works in both languages
- [ ] Plant details show translated content
- [ ] Scientific names remain in Latin
- [ ] Numbers and IDs are not translated
- [ ] Cache works (second translation is instant)

---

## Troubleshooting

### Issue: Translations not showing

**Solution:**
1. Check browser console for errors
2. Verify translation keys exist in both `en/common.json` and `ar/common.json`
3. Check that `useTranslation` hook is called in a client component (`'use client'`)

### Issue: RTL not working

**Solution:**
1. Check `document.documentElement.dir` in browser console
2. Verify Tailwind CSS supports RTL (it does by default)
3. Clear browser cache and reload

### Issue: Google Translate not working

**Solution:**
1. Verify package is installed:
   ```bash
   composer show stichoza/google-translate-php
   ```
2. Check Laravel logs:
   ```bash
   tail -f storage/logs/laravel.log
   ```
3. Fallback to manual translation will be used automatically

### Issue: Language not persisting

**Solution:**
1. Check localStorage in browser DevTools
2. Verify `ClientI18nProvider` is wrapping your app
3. Check that language is saved on change:
   ```javascript
   localStorage.setItem('language', 'ar')
   ```

### Issue: API returns English even when requesting Arabic

**Solution:**
1. Check that language parameter is sent:
   ```typescript
   formData.append('language', 'ar');
   ```
2. Verify backend receives it:
   ```php
   \Log::info('Language:', ['lang' => $request->input('language')]);
   ```
3. Check TranslationService is injected in controller

---

## Performance Optimization

### Frontend

- Translations are bundled at build time
- No runtime translation needed for static text
- Language switching uses `window.location.reload()` for clean state

### Backend

- Google Translate responses are cached for 30 days
- Cache key based on text + source + target language
- Fallback to manual translations if service fails
- Only translates when `targetLang !== 'en'`

### Caching Strategy

```php
// TranslationService.php
$cacheKey = 'translation_' . md5($text . $sourceLang . $targetLang);

return Cache::remember($cacheKey, 60 * 60 * 24 * 30, function () {
    return $this->translator->translate($text);
});
```

To clear translation cache:
```php
$translationService->clearCache();
```

---

## Advanced Customization

### Add More Languages

1. **Frontend:**
   ```javascript
   // next-i18next.config.js
   locales: ['en', 'ar', 'fr', 'es']
   ```

2. **Create translation files:**
   ```
   public/locales/fr/common.json
   public/locales/es/common.json
   ```

3. **Backend:**
   ```php
   // TranslationService@translate
   $this->translator->setTarget($targetLang); // Supports 100+ languages
   ```

### Exclude Specific Fields from Translation

```php
$translationService->translateDeep($data, 'ar', 'en', [
    'scientific_name',
    'url',
    'custom_field_to_skip'
]);
```

### Manual Translation Override

You can still use the fallback `translateToArabic()` method for specific terms:

```php
private function translatePlantData($plantData, $targetLanguage)
{
    // Force manual translation for specific terms
    if (isset($plantData['care_info']['light'])) {
        $plantData['care_info']['light'] = $this->manualTranslate(
            $plantData['care_info']['light'],
            $targetLanguage
        );
    }

    // Use automatic for everything else
    return $this->translationService->translatePlantData($plantData, $targetLanguage);
}
```

---

## Summary

You now have a complete bilingual translation system with:

✅ **Static UI translation** via i18next
✅ **Dynamic API translation** via Google Translate
✅ **RTL/LTR support** automatic
✅ **Language persistence** in localStorage
✅ **Cached translations** for performance
✅ **Smart field handling** (preserves scientific names, etc.)

The system is production-ready and fully functional!

### Quick Reference

**Frontend:**
- Add translations: `public/locales/{lang}/common.json`
- Use translations: `const { t } = useTranslation(); t('key')`
- Language switcher: `src/components/LanguageSwitcher.tsx`

**Backend:**
- Install: `composer require stichoza/google-translate-php`
- Use: `$this->translationService->translatePlantData($data, 'ar')`
- Routes: Already configured in `routes/api.php`

**Testing:**
- Frontend: `npm run dev` → http://localhost:3000
- Backend: `php artisan serve` → http://localhost:8000
- Switch language and verify both UI and API responses

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review Laravel logs: `storage/logs/laravel.log`
3. Check browser console for frontend errors
4. Verify all translation files are properly formatted JSON

**Package Documentation:**
- [i18next](https://www.i18next.com/)
- [next-i18next](https://github.com/i18next/next-i18next)
- [Google Translate PHP](https://github.com/Stichoza/google-translate-php)
