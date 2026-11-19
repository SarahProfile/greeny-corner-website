// Canonical public origin of this deployment. The same codebase is built once per domain
// (www.greenycorner.ae and www.greenycorner.com); set NEXT_PUBLIC_SITE_URL at build time.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.greenycorner.ae').replace(/\/+$/, '');
