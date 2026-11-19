/**
 * Plant display names.
 *
 * Always show the COMMON name in the visitor's language ("Fiddle Leaf Fig" /
 * "تين كمان"), never the Latin name ("Ficus lyrata") unless nothing else exists.
 * `plant.name` alone can't be trusted: PlantNet may leave the scientific name
 * there, and a plant added while the site was in Arabic can have the Arabic name
 * in it. Same rules as the mobile app (greeny-corner-mobile/src/utils/plantName.js).
 */

export interface PlantNameSource {
  name?: string;
  scientific_name?: string;
  api_data?: {
    name?: string;
    name_en?: string;
    name_ar?: string;
    arabic_name?: string;
    common_name_resolved?: string;
    common_names?: string[];
    scientific_name?: string;
  } | null;
}

const ARABIC_RE = /[؀-ۿ]/;

export const hasArabic = (s?: string | null): boolean => !!s && ARABIC_RE.test(s);

const clean = (s?: string | null): string => (typeof s === 'string' ? s.trim() : '');

const norm = (s?: string | null): string =>
  clean(s).toLowerCase().replace(/\s[×x]\s/g, ' ').replace(/['‘’"]/g, '').replace(/\s+/g, ' ').trim();

export const getScientificName = (plant: PlantNameSource): string =>
  clean(plant.scientific_name) || clean(plant.api_data?.scientific_name);

/** True when `name` is just the plant's Latin name (also with a cultivar suffix). */
export const isScientificName = (name: string | undefined, plant: PlantNameSource): boolean => {
  const n = norm(name);
  const sci = norm(getScientificName(plant));
  if (!n || !sci || hasArabic(n)) return false;
  // A genus-only name ("Monstera") is a legitimate common name, so only exact / cultivar matches count.
  return n === sci || n.startsWith(`${sci} `);
};

const usableEnglish = (name: string | undefined, plant: PlantNameSource): boolean =>
  !!clean(name) && !hasArabic(name) && !isScientificName(name, plant);

export function getLocalizedPlantName(
  plant: PlantNameSource,
  language: string,
  translatedName?: string | null
): string {
  const api = plant.api_data || {};

  if (language === 'ar') {
    const candidates = [api.name_ar, api.arabic_name, translatedName, plant.name, api.name];
    return candidates.map(clean).find((n) => hasArabic(n)) || clean(translatedName) || clean(plant.name) || clean(api.name);
  }

  const english = [api.name_en, api.common_name_resolved, ...(api.common_names || []), api.name, plant.name]
    .map(clean)
    .find((n) => usableEnglish(n, plant));
  if (english) return english;

  // Nothing better known: keep the stored name (even if Latin) rather than an unrelated one
  return clean(api.name) && !hasArabic(api.name)
    ? clean(api.name)
    : (!hasArabic(plant.name) && clean(plant.name)) || getScientificName(plant) || clean(plant.name);
}
