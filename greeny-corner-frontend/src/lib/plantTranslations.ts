/**
 * Plant data translations for common values
 * This translates PlantNet API values that come in English
 */

export const plantValueTranslations: Record<string, Record<string, string>> = {
  // Light requirements
  'bright indirect light': {
    ar: 'ضوء ساطع غير مباشر',
    en: 'bright indirect light'
  },
  'bright direct light': {
    ar: 'ضوء ساطع مباشر',
    en: 'bright direct light'
  },
  'low light': {
    ar: 'إضاءة منخفضة',
    en: 'low light'
  },
  'medium light': {
    ar: 'إضاءة متوسطة',
    en: 'medium light'
  },
  'full sun': {
    ar: 'شمس كاملة',
    en: 'full sun'
  },
  'partial shade': {
    ar: 'ظل جزئي',
    en: 'partial shade'
  },

  // Humidity levels
  'high': {
    ar: 'عالية',
    en: 'high'
  },
  'medium': {
    ar: 'متوسطة',
    en: 'medium'
  },
  'low': {
    ar: 'منخفضة',
    en: 'low'
  },
  'moderate': {
    ar: 'معتدلة',
    en: 'moderate'
  },

  // Common plant families
  'Araceae': {
    ar: 'القلقاسية',
    en: 'Araceae'
  },
  'Asparagaceae': {
    ar: 'الهليونية',
    en: 'Asparagaceae'
  },
  'Cactaceae': {
    ar: 'الصبارية',
    en: 'Cactaceae'
  },
  'Moraceae': {
    ar: 'التوتية',
    en: 'Moraceae'
  },
  'Arecaceae': {
    ar: 'النخيلية',
    en: 'Arecaceae'
  },

  // Temperature ranges (common patterns)
  '15-24°C': {
    ar: '١٥-٢٤ درجة مئوية',
    en: '15-24°C'
  },
  '18-24°C': {
    ar: '١٨-٢٤ درجة مئوية',
    en: '18-24°C'
  },
  '20-30°C': {
    ar: '٢٠-٣٠ درجة مئوية',
    en: '20-30°C'
  }
};

/**
 * Translate a plant data value
 * @param value - The value to translate (e.g., "bright indirect light")
 * @param language - Target language ('en' or 'ar')
 * @returns Translated value or original if no translation found
 */
export function translatePlantValue(value: string | null | undefined, language: string): string {
  if (!value) return '';

  const lowerValue = value.toLowerCase().trim();

  // Check for exact match
  if (plantValueTranslations[lowerValue]) {
    return plantValueTranslations[lowerValue][language] || value;
  }

  // Check for partial matches (case-insensitive)
  for (const [key, translations] of Object.entries(plantValueTranslations)) {
    if (lowerValue.includes(key.toLowerCase())) {
      return value.replace(new RegExp(key, 'gi'), translations[language] || key);
    }
  }

  // If no translation found, return original
  return value;
}
