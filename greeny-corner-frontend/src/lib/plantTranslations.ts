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
  'Araliaceae': {
    ar: 'الأراليية',
    en: 'Araliaceae'
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
  },

  // Origins
  'various tropical and subtropical regions': {
    ar: 'مناطق استوائية وشبه استوائية مختلفة',
    en: 'Various tropical and subtropical regions'
  },
  'tropical regions': {
    ar: 'المناطق الاستوائية',
    en: 'Tropical regions'
  },
  'subtropical regions': {
    ar: 'المناطق شبه الاستوائية',
    en: 'Subtropical regions'
  },
  'south america': {
    ar: 'أمريكا الجنوبية',
    en: 'South America'
  },
  'central america': {
    ar: 'أمريكا الوسطى',
    en: 'Central America'
  },
  'asia': {
    ar: 'آسيا',
    en: 'Asia'
  },
  'africa': {
    ar: 'أفريقيا',
    en: 'Africa'
  },

  // Sizes and measurements
  '1-4 feet': {
    ar: '١-٤ أقدام',
    en: '1-4 feet'
  },
  '1-3 feet': {
    ar: '١-٣ أقدام',
    en: '1-3 feet'
  },
  '2-6 feet': {
    ar: '٢-٦ أقدام',
    en: '2-6 feet'
  },
  'typical houseplant size': {
    ar: 'حجم نبات منزلي نموذجي',
    en: 'typical houseplant size'
  },

  // Growth rates
  'slow': {
    ar: 'بطيء',
    en: 'slow'
  },
  'fast': {
    ar: 'سريع',
    en: 'fast'
  },
  'moderate growth': {
    ar: 'نمو معتدل',
    en: 'moderate growth'
  },

  // Growth habits
  'varies by species': {
    ar: 'يختلف حسب النوع',
    en: 'Varies by species'
  },
  'climbing': {
    ar: 'متسلق',
    en: 'climbing'
  },
  'trailing': {
    ar: 'متدلي',
    en: 'trailing'
  },
  'upright': {
    ar: 'منتصب',
    en: 'upright'
  },
  'bushy': {
    ar: 'كثيف',
    en: 'bushy'
  },
  'spreading': {
    ar: 'منتشر',
    en: 'spreading'
  },

  // Care tips (common phrases)
  'water when top soil feels dry. place in bright, indirect light.': {
    ar: 'اسقِ عندما تشعر أن التربة العلوية جافة. ضع في ضوء ساطع غير مباشر.',
    en: 'Water when top soil feels dry. Place in bright, indirect light.'
  },
  'water when top soil feels dry': {
    ar: 'اسقِ عندما تشعر أن التربة العلوية جافة',
    en: 'Water when top soil feels dry'
  },
  'place in bright, indirect light': {
    ar: 'ضع في ضوء ساطع غير مباشر',
    en: 'Place in bright, indirect light'
  },
  'water when': {
    ar: 'اسقِ عندما',
    en: 'water when'
  },
  'top soil feels dry': {
    ar: 'تشعر أن التربة العلوية جافة',
    en: 'top soil feels dry'
  },
  'place in': {
    ar: 'ضع في',
    en: 'place in'
  },
  'bright, indirect light': {
    ar: 'ضوء ساطع غير مباشر',
    en: 'bright, indirect light'
  },

  // Common descriptions
  'a beautiful houseplant that brings natural beauty and fresh air to your living space': {
    ar: 'نبات منزلي جميل يضفي جمالاً طبيعياً وهواءً نقياً على مساحتك المعيشية',
    en: 'A beautiful houseplant that brings natural beauty and fresh air to your living space'
  },
  'beautiful houseplant': {
    ar: 'نبات منزلي جميل',
    en: 'beautiful houseplant'
  },
  'natural beauty': {
    ar: 'جمال طبيعي',
    en: 'natural beauty'
  },
  'fresh air': {
    ar: 'هواء نقي',
    en: 'fresh air'
  },
  'living space': {
    ar: 'مساحة المعيشة',
    en: 'living space'
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

  // Check for exact match (case-insensitive)
  if (plantValueTranslations[lowerValue]) {
    return plantValueTranslations[lowerValue][language] || value;
  }

  // Try to translate sentence by sentence for multi-sentence text
  if (value.includes('. ')) {
    const sentences = value.split('. ');
    const translatedSentences = sentences.map(sentence => {
      const trimmedSentence = sentence.trim();
      const lowerSentence = trimmedSentence.toLowerCase();

      // Check if this sentence has a translation
      if (plantValueTranslations[lowerSentence]) {
        return plantValueTranslations[lowerSentence][language] || trimmedSentence;
      }

      // Try with period at the end
      if (plantValueTranslations[lowerSentence + '.']) {
        return plantValueTranslations[lowerSentence + '.'][language] || trimmedSentence;
      }

      // Return original sentence if no translation
      return trimmedSentence;
    });

    return translatedSentences.join('. ');
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
