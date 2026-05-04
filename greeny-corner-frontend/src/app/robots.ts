import { MetadataRoute } from 'next';

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
    sitemap: 'https://www.greenycorner.ae/sitemap.xml',
  };
}
