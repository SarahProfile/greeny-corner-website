/**
 * Health notes are stored as a JSON string {"en": "...", "ar": "..."} (both can be null for a
 * healthy plant), or as legacy plain text. Never show the raw JSON to the user.
 */

const isEmpty = (s: unknown): boolean =>
  typeof s !== 'string' || s.trim() === '' || /^(null|undefined|none|n\/a)$/i.test(s.trim());

const asText = (v: unknown): string => (isEmpty(v) ? '' : (v as string).trim());

const tryParse = (v: unknown): unknown => {
  if (typeof v !== 'string') return v;
  const t = v.trim();
  if (!t.startsWith('{') && !t.startsWith('[') && !t.startsWith('"')) return v;
  try {
    return JSON.parse(t);
  } catch {
    return v;
  }
};

/** Notes in the requested language (falls back to the other language); '' when there is nothing to show. */
export function parseHealthNotes(notes: unknown, language: string = 'en'): string {
  const parsed = tryParse(tryParse(notes)); // tolerate double-encoded JSON
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const o = parsed as Record<string, unknown>;
    const [first, second] = language === 'ar' ? [o.ar, o.en] : [o.en, o.ar];
    return asText(first) || asText(second);
  }
  return asText(parsed);
}

/** English notes (what we send to the AI / translate). */
export const englishHealthNotes = (notes: unknown): string => parseHealthNotes(notes, 'en');
