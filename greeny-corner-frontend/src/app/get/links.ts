const IOS_BASE = 'https://apps.apple.com/ae/app/greeny-corner/id6756967530';
const ANDROID_BASE = 'https://play.google.com/store/apps/details?id=com.greenycorner.app';

// Optional: the provider ID from App Store Connect -> Analytics -> Campaigns.
// Without it Apple ignores the campaign name, so the iOS link stays plain.
const APPSTORE_PROVIDER_TOKEN = process.env.APPSTORE_PROVIDER_TOKEN || '';

// Channel names are free text from the URL (?src=instagram), so keep them tame.
export function cleanSource(raw?: string | string[]): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const cleaned = (value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
  return cleaned || 'direct';
}

export function iosUrl(src: string): string {
  if (!APPSTORE_PROVIDER_TOKEN) return IOS_BASE;
  return `${IOS_BASE}?pt=${encodeURIComponent(APPSTORE_PROVIDER_TOKEN)}&ct=${encodeURIComponent(src)}&mt=8`;
}

// Play Console reports the referrer under Statistics -> Acquisition (via Play Install Referrer).
export function androidUrl(src: string): string {
  const referrer = `utm_source=${src}&utm_medium=smartlink&utm_campaign=organic`;
  return `${ANDROID_BASE}&referrer=${encodeURIComponent(referrer)}`;
}

export type Platform = 'ios' | 'android' | 'other';

export function detectPlatform(userAgent: string): Platform {
  // Link-preview crawlers must get the page (with its social card), not a redirect.
  if (/bot|crawl|spider|facebookexternalhit|whatsapp|telegram|slack|preview|embedly|pinterest/i.test(userAgent)) {
    return 'other';
  }
  if (/android/i.test(userAgent)) return 'android';
  // iPadOS Safari reports itself as a Mac, so only phones/iPads that say so are caught.
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  return 'other';
}
