import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/my-plants/'],
    },
    sitemap: 'https://greenycorner.ae/sitemap.xml',
  };
}
