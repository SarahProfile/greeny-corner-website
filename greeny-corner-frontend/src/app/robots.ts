import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/my-plants/',
          '/account/',
          '/notifications/',
          '/add-plant/',
          '/admin/',
          '/auth-test/',
          '/firebase-debug/',
          '/debug-translations/',
          '/login-new/',
          '/register-new/',
          '/forgot-password-mobile/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
