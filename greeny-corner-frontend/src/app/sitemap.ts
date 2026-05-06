import { MetadataRoute } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.greenycorner.ae/api';
const BASE = 'https://www.greenycorner.ae';

async function fetchPlantSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const slugs: { slug: string; updated_at: string }[] = [];
  try {
    for (let page = 1; page <= 20; page++) {
      const res = await fetch(`${API}/encyclopedia/plants/slugs?page=${page}&limit=500`, {
        next: { revalidate: 86400 },
      });
      if (!res.ok) break;
      const data = await res.json();
      slugs.push(...(data.data ?? []));
      if (page >= (data.last_page ?? 1)) break;
    }
  } catch {}
  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/plant-identifier`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE}/plants`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/support`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const plantSlugs = await fetchPlantSlugs();

  const plantPages: MetadataRoute.Sitemap = plantSlugs.map(({ slug, updated_at }) => ({
    url: `${BASE}/plants/${slug}`,
    lastModified: updated_at ? new Date(updated_at) : now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticPages, ...plantPages];
}
