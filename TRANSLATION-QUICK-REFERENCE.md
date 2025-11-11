# Translation System - Quick Reference Card

## 🚀 Quick Start

### Install Backend Package
```bash
cd greeny-corner-backend
composer require stichoza/google-translate-php
```

### Start Servers
```bash
# Terminal 1 - Backend
cd greeny-corner-backend
php artisan serve

# Terminal 2 - Frontend
cd greeny-corner-frontend
npm run dev
```

---

## 📝 Frontend Cheat Sheet

### Use Translation in Component
```typescript
'use client';
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>Language: {i18n.language}</p>
    </div>
  );
}
```

### Get Current Language
```typescript
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
const currentLang = i18n.language; // 'en' or 'ar'
```

### Add Translation Keys
1. Edit `public/locales/en/common.json`:
   ```json
   {
     "mySection": {
       "title": "My Title"
     }
   }
   ```

2. Edit `public/locales/ar/common.json`:
   ```json
   {
     "mySection": {
       "title": "عنواني"
     }
   }
   ```

3. Use in component:
   ```typescript
   {t('mySection.title')}
   ```

### Call API with Language
```typescript
import { plantsAPI } from '@/lib/api';

// Add plant with current language
const lang = localStorage.getItem('language') || 'en';
const plant = await plantsAPI.addPlant(imageFile, lang);

// Refresh plants when language changes
await plantsAPI.refreshPlantsLanguage('ar');
```

---

## 🔧 Backend Cheat Sheet

### Use TranslationService in Controller

```php
use App\Services\TranslationService;

class MyController extends Controller
{
    protected $translationService;

    public function __construct(TranslationService $translationService)
    {
        $this->translationService = $translationService;
    }

    public function myMethod(Request $request)
    {
        $lang = $request->input('language', 'en');

        // Simple translation
        $text = $this->translationService->translate(
            'Hello World',
            $lang
        );

        // Translate plant data
        $plantData = ['name' => 'Rose', 'description' => 'Beautiful flower'];
        $translated = $this->translationService->translatePlantData(
            $plantData,
            $lang
        );

        return response()->json($translated);
    }
}
```

### Get Language from Request
```php
$language = $request->input('language', 'en'); // Default to 'en'
```

### Translate Plant Data
```php
$plantData = $this->identifyWithPlantNet($image);
$translatedData = $this->translationService->translatePlantData($plantData, 'ar');
```

### Skip Specific Fields
```php
$translated = $this->translationService->translateDeep($data, 'ar', 'en', [
    'scientific_name',
    'url',
    'id',
    'custom_field'
]);
```

---

## 🎨 RTL/LTR Styling

### Current Implementation
```typescript
// Automatic in ClientI18nProvider
document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
```

### Check Direction in Component
```typescript
const isRTL = i18n.language === 'ar';

<div className={isRTL ? 'text-right' : 'text-left'}>
  {t('content')}
</div>
```

### Tailwind RTL Classes (auto-handled)
- `ml-4` becomes `mr-4` in RTL
- `left-0` becomes `right-0` in RTL
- `text-left` becomes `text-right` in RTL

---

## 🔍 Common Translation Keys

### Authentication
```typescript
t('auth.signIn')           // "Sign in" / "تسجيل الدخول"
t('auth.signUp')           // "Sign up" / "إنشاء حساب"
t('auth.signOut')          // "Sign out" / "تسجيل خروج"
t('auth.emailAddress')     // "Email address" / "عنوان البريد الإلكتروني"
```

### Navigation
```typescript
t('navigation.home')       // "Home" / "الرئيسية"
t('navigation.myPlants')   // "My Plants" / "نباتاتي"
t('navigation.addPlant')   // "Add Plant" / "إضافة نبتة"
```

### Plants
```typescript
t('plants.addNewPlant')    // "Add New Plant" / "إضافة نبتة جديدة"
t('plants.waterNow')       // "Water Now" / "سقي الآن"
t('plants.careSchedule')   // "Care Schedule" / "جدول الرعاية"
```

### Common
```typescript
t('common.loading')        // "Loading..." / "جار التحميل..."
t('common.save')           // "Save" / "حفظ"
t('common.delete')         // "Delete" / "حذف"
t('common.cancel')         // "Cancel" / "إلغاء"
```

---

## 🧪 Testing Commands

### Test Translation in Laravel
```bash
php artisan tinker
```
```php
$service = new \App\Services\TranslationService();
$result = $service->translate('Hello', 'ar');
echo $result; // مرحبا
```

### Test API with cURL
```bash
# Add plant in Arabic
curl -X POST http://localhost:8000/api/plants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@plant.jpg" \
  -F "language=ar"

# Refresh plants language
curl -X POST http://localhost:8000/api/plants/refresh-language \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language":"ar"}'
```

---

## 🐛 Debug Helpers

### Frontend Debug
```typescript
// Check current language
console.log('Language:', i18n.language);

// Check localStorage
console.log('Saved lang:', localStorage.getItem('language'));

// Check HTML attributes
console.log('Dir:', document.documentElement.dir);
console.log('Lang:', document.documentElement.lang);

// Check translation exists
console.log('Translation:', t('key.path'));
```

### Backend Debug
```php
// Log language
\Log::info('Language:', ['lang' => $request->input('language')]);

// Log translation
\Log::info('Translation:', [
    'original' => $text,
    'translated' => $translated
]);

// Check cache
Cache::get('translation_' . md5($text . 'en' . 'ar'));
```

---

## 📦 File Structure

```
greeny-corner-website/
├── greeny-corner-frontend/
│   ├── public/locales/
│   │   ├── en/common.json          # English translations
│   │   └── ar/common.json          # Arabic translations
│   ├── src/
│   │   ├── components/
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   └── ClientI18nProvider.tsx
│   │   ├── lib/
│   │   │   ├── i18n.ts             # i18n config
│   │   │   └── api.ts              # API with language support
│   │   └── app/
│   │       └── layout.tsx          # Root layout with i18n
│   └── next-i18next.config.js      # Next.js i18n config
│
└── greeny-corner-backend/
    ├── app/
    │   ├── Services/
    │   │   └── TranslationService.php   # Translation logic
    │   └── Http/Controllers/API/
    │       └── PlantController.php      # Uses TranslationService
    └── routes/
        └── api.php                      # API routes

```

---

## 🎯 API Endpoints

### Plant Endpoints with Language Support

| Method | Endpoint | Language Param | Description |
|--------|----------|----------------|-------------|
| POST | `/api/plants` | `language` in FormData | Add plant with language |
| POST | `/api/plants/identify` | `language` in FormData | Identify plant |
| POST | `/api/plants/refresh-language` | `language` in JSON body | Refresh all plants |
| POST | `/api/plants/{id}/update-image` | `language` in FormData | Update plant image |

### Example Request
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('language', 'ar');

const response = await fetch('/api/plants', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

---

## 💡 Pro Tips

1. **Always use translation keys, never hardcode text:**
   ```typescript
   // ❌ Bad
   <button>Add Plant</button>

   // ✅ Good
   <button>{t('plants.addPlant')}</button>
   ```

2. **Keep translation keys organized by section:**
   ```json
   {
     "auth": {...},
     "navigation": {...},
     "plants": {...}
   }
   ```

3. **Test both languages regularly:**
   - Switch language frequently during development
   - Check RTL layout doesn't break UI
   - Verify all text is translated

4. **Cache is your friend:**
   - Translations are cached for 30 days
   - No need to worry about API rate limits
   - Clear cache if translations seem stuck

5. **Scientific names stay in Latin:**
   - The system automatically skips translating scientific names
   - Also skips: URLs, IDs, numbers, confidence scores

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Translations not showing | Check console, verify keys exist in both language files |
| RTL not working | Check `document.documentElement.dir` in console |
| API returns English | Verify `language` parameter is sent in request |
| Cache issues | Clear Laravel cache: `php artisan cache:clear` |
| Language not persisting | Check localStorage in DevTools |

---

## 📚 Resources

- Full Documentation: `BILINGUAL-TRANSLATION-GUIDE.md`
- Setup Script: `./TRANSLATION-SETUP.sh`
- i18next Docs: https://www.i18next.com/
- Google Translate PHP: https://github.com/Stichoza/google-translate-php

---

**Last Updated:** 2025-11-11
**Version:** 1.0.0
