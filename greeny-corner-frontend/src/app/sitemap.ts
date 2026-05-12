import { MetadataRoute } from 'next';

const API  = process.env.NEXT_PUBLIC_API_URL || 'https://api.greenycorner.ae/api';
const BASE = 'https://www.greenycorner.ae';

// 10 K URLs per sitemap file (Google limit is 50 K, we stay conservative)
const CHUNK_SIZE = 10000;
const API_LIMIT  = 500; // rows per API call
const PAGES_PER_CHUNK = CHUNK_SIZE / API_LIMIT; // 20 API pages = 10 K slugs

export const revalidate = 86400; // regenerate sitemaps once a day

// ── helpers ───────────────────────────────────────────────────────────────────

async function getTotalPlants(): Promise<number> {
  try {
    const res = await fetch(`${API}/encyclopedia/plants/slugs?page=1&limit=1`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.total ?? 0;
  } catch {
    return 0;
  }
}

async function fetchSlugChunk(
  chunkIndex: number,
): Promise<{ slug: string; updated_at: string }[]> {
  const startPage = chunkIndex * PAGES_PER_CHUNK + 1;
  const endPage   = startPage + PAGES_PER_CHUNK - 1;
  const slugs: { slug: string; updated_at: string }[] = [];

  for (let page = startPage; page <= endPage; page++) {
    try {
      const res = await fetch(
        `${API}/encyclopedia/plants/slugs?page=${page}&limit=${API_LIMIT}`,
        { next: { revalidate: 86400 } },
      );
      if (!res.ok) break;
      const data = await res.json();
      slugs.push(...(data.data ?? []));
      if (page >= (data.last_page ?? 1)) break;
    } catch {
      break;
    }
  }

  return slugs;
}

// ── generateSitemaps ──────────────────────────────────────────────────────────
// Next.js will create /sitemap/0.xml (static pages), /sitemap/1.xml … (plants)
// and an index at /sitemap.xml pointing to all chunks.

export async function generateSitemaps() {
  const total = await getTotalPlants();
  const numPlantChunks = Math.max(1, Math.ceil(total / CHUNK_SIZE));
  // id 0 = static pages | id 1…N = plant page chunks
  return [
    { id: 0 },
    ...Array.from({ length: numPlantChunks }, (_, i) => ({ id: i + 1 })),
  ];
}

// ── sitemap ───────────────────────────────────────────────────────────────────

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── id 0: static / high-priority pages ──────────────────────────────────
  if (id === 0) {
    return [
      { url: BASE,                        lastModified: now, changeFrequency: 'daily',   priority: 1    },
      { url: `${BASE}/plant-identifier`,  lastModified: now, changeFrequency: 'weekly',  priority: 0.95 },
      { url: `${BASE}/plants`,            lastModified: now, changeFrequency: 'daily',   priority: 0.9  },
      { url: `${BASE}/ar/plants`,         lastModified: now, changeFrequency: 'daily',   priority: 0.9  },
      { url: `${BASE}/about`,             lastModified: now, changeFrequency: 'monthly', priority: 0.8  },
      { url: `${BASE}/support`,           lastModified: now, changeFrequency: 'monthly', priority: 0.7  },
      { url: `${BASE}/login`,             lastModified: now, changeFrequency: 'monthly', priority: 0.6  },
      { url: `${BASE}/register`,          lastModified: now, changeFrequency: 'monthly', priority: 0.6  },
      { url: `${BASE}/privacy`,           lastModified: now, changeFrequency: 'yearly',  priority: 0.3  },
    ];
  }

  // ── id 1…N: plant page chunks (English + Arabic pairs) ───────────────────
  const chunkIndex = id - 1; // 0-based chunk index
  const slugs = await fetchSlugChunk(chunkIndex);

  const entries: MetadataRoute.Sitemap = [];
  for (const { slug, updated_at } of slugs) {
    const lastMod = updated_at ? new Date(updated_at) : now;
    entries.push({ url: `${BASE}/plants/${slug}`,    lastModified: lastMod, changeFrequency: 'monthly', priority: 0.8 });
    entries.push({ url: `${BASE}/ar/plants/${slug}`, lastModified: lastMod, changeFrequency: 'monthly', priority: 0.8 });
  }
  return entries;
}
