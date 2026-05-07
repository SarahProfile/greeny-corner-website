const CACHE_PREFIX = 'plant_translation_v1_';

/**
 * Translates text using the Google Translate unofficial API.
 * Results are cached in sessionStorage.
 */
export async function translateText(text: string, targetLang: string, sourceLang = 'en'): Promise<string> {
  if (!text || targetLang === sourceLang) return text;

  const cacheKey = `${CACHE_PREFIX}${sourceLang}_${targetLang}_${text}`;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch (_) {}

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const json = await res.json();

    const translated: string = json?.[0]
      ?.map((part: any) => part?.[0])
      ?.filter(Boolean)
      ?.join('') ?? '';

    if (translated && translated.toLowerCase() !== text.toLowerCase()) {
      try { sessionStorage.setItem(cacheKey, translated); } catch (_) {}
      return translated;
    }
  } catch (_) {}

  return text;
}
