import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import PlantSearch from './PlantSearch';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.greenycorner.ae/api';

export const revalidate = 3600;

interface PlantListItem {
  id: number;
  slug: string;
  name: string;
  scientific_name?: string;
  family?: string;
  image?: string;
  is_featured?: boolean;
  care_info?: {
    watering_interval_days?: number;
    light?: string;
    difficulty?: string;
  };
}

interface PaginatedPlants {
  data: PlantListItem[];
  total: number;
  current_page: number;
  last_page: number;
}

async function fetchPlants(params: Record<string, string>): Promise<PaginatedPlants> {
  try {
    const qs = new URLSearchParams({ limit: '24', ...params }).toString();
    const res = await fetch(`${API}/encyclopedia/plants?${qs}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { data: [], total: 0, current_page: 1, last_page: 1 };
    return res.json();
  } catch {
    return { data: [], total: 0, current_page: 1, last_page: 1 };
  }
}

async function fetchFamilies(): Promise<string[]> {
  try {
    const res = await fetch(`${API}/encyclopedia/families`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchFeatured(): Promise<PlantListItem[]> {
  try {
    const res = await fetch(`${API}/encyclopedia/featured`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Plant Encyclopedia — Browse 10,000+ Plants | Greeny Corner',
    description: 'Explore our complete plant encyclopedia with care guides, watering schedules, and growing tips for thousands of plants. Find your perfect plant today.',
    openGraph: {
      title: 'Plant Encyclopedia | Greeny Corner',
      description: 'Browse 10,000+ plants with care guides and growing tips.',
      url: 'https://greenycorner.ae/plants',
      siteName: 'Greeny Corner',
      type: 'website',
    },
    alternates: { canonical: 'https://greenycorner.ae/plants' },
  };
}

function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  const d = (difficulty ?? 'moderate').toLowerCase();
  const color = d === 'easy' ? 'bg-green-100 text-green-700' : d === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{difficulty ?? 'Moderate'}</span>;
}

function PlantCard({ plant }: { plant: PlantListItem }) {
  return (
    <Link href={`/plants/${plant.slug}`} className="group block bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
      <div className="relative h-44 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
        {plant.image ? (
          <img
            src={plant.image}
            alt={plant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🌿</div>
        )}
        {plant.is_featured && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">⭐ Featured</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
          {plant.name}
        </h3>
        {plant.scientific_name && (
          <p className="text-xs text-gray-400 italic mb-2 line-clamp-1">{plant.scientific_name}</p>
        )}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {plant.family && (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{plant.family}</span>
          )}
          <DifficultyBadge difficulty={plant.care_info?.difficulty} />
        </div>
        {plant.care_info?.watering_interval_days && (
          <p className="text-xs text-gray-500 mt-2">💧 Every {plant.care_info.watering_interval_days} days</p>
        )}
      </div>
    </Link>
  );
}

export default async function PlantDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const page   = params.page   || '1';
  const q      = params.q      || '';
  const family = params.family || '';

  const fetchParams: Record<string, string> = { page };
  if (q)      fetchParams.q      = q;
  if (family) fetchParams.family = family;

  const [plantsData, families, featured] = await Promise.all([
    fetchPlants(fetchParams),
    fetchFamilies(),
    !q && !family && page === '1' ? fetchFeatured() : Promise.resolve([]),
  ]);

  const { data: plants, total, current_page, last_page } = plantsData;
  const isFiltered = !!(q || family);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Plant Encyclopedia',
    description: 'Browse thousands of plants with care guides',
    url: 'https://greenycorner.ae/plants',
    numberOfItems: total,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-emerald-700 font-bold text-xl">
            🌿 Greeny Corner
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/plants" className="text-emerald-600 font-semibold">Plant Encyclopedia</Link>
            <Link href="/plant-identifier" className="text-gray-600 hover:text-emerald-600">Identify Plant</Link>
            <Link href="/register" className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-600 transition-colors">Get App</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🌱 Plant Encyclopedia
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Explore {total > 0 ? total.toLocaleString() + '+' : 'thousands of'} plants with expert care guides
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Sourced from Perenual, GBIF, and Wikipedia
          </p>

          {/* Search */}
          <div className="flex justify-center">
            <Suspense>
              <PlantSearch defaultValue={q} />
            </Suspense>
          </div>
        </div>

        {/* Family filter chips */}
        {families.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
            <Link
              href="/plants"
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${!family ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'}`}
            >
              All Families
            </Link>
            {families.slice(0, 40).map(f => (
              <Link
                key={f}
                href={`/plants?family=${encodeURIComponent(f)}`}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${family === f ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'}`}
              >
                {f}
              </Link>
            ))}
          </div>
        )}

        {/* Featured section (shown only on first page with no filters) */}
        {featured.length > 0 && !isFiltered && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">⭐ Featured Plants</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {featured.map(plant => <PlantCard key={plant.id} plant={plant} />)}
            </div>
          </section>
        )}

        {/* Search/filter results heading */}
        {isFiltered && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {total.toLocaleString()} result{total !== 1 ? 's' : ''}
              {q ? ` for "${q}"` : ''}
              {family ? ` in ${family}` : ''}
            </p>
            <Link href="/plants" className="text-sm text-emerald-600 hover:underline">Clear filters</Link>
          </div>
        )}

        {/* All plants heading */}
        {!isFiltered && (
          <h2 className="text-2xl font-bold text-gray-900 mb-5">
            {family ? family : 'All Plants'} <span className="text-base font-normal text-gray-400">({total.toLocaleString()})</span>
          </h2>
        )}

        {/* Grid */}
        {plants.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
            {plants.map(plant => <PlantCard key={plant.id} plant={plant} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-600 mb-2">No plants found</p>
            <p className="text-gray-400 mb-6">Try a different search term or browse all plants</p>
            <Link href="/plants" className="text-emerald-600 font-semibold hover:underline">Browse all plants →</Link>
          </div>
        )}

        {/* Pagination */}
        {last_page > 1 && (
          <div className="flex justify-center items-center gap-3 mt-12">
            {current_page > 1 && (
              <Link
                href={`/plants?${new URLSearchParams({ ...fetchParams, page: String(current_page - 1) })}`}
                className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-emerald-400 transition-colors"
              >
                ← Previous
              </Link>
            )}
            <span className="text-gray-600 font-medium">Page {current_page} of {last_page}</span>
            {current_page < last_page && (
              <Link
                href={`/plants?${new URLSearchParams({ ...fetchParams, page: String(current_page + 1) })}`}
                className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-10 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-3">Track Your Plants 🌿</h2>
          <p className="text-emerald-100 mb-6 text-lg">
            Never miss a watering. Get reminders, AI health checks, and personalized care tips.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-white text-emerald-700 font-bold px-8 py-3 rounded-2xl hover:bg-emerald-50 transition-colors shadow-md">
              Get Started Free
            </Link>
            <Link href="/plant-identifier" className="border-2 border-white text-white font-bold px-8 py-3 rounded-2xl hover:bg-white/10 transition-colors">
              Identify a Plant
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-16 py-8 text-center text-gray-500 text-sm">
        <p>🌿 <Link href="/" className="text-emerald-600 font-semibold">Greeny Corner</Link> — Made for plant lovers</p>
        <p className="mt-1">
          <Link href="/plants" className="hover:underline">Plant Encyclopedia</Link> ·{' '}
          <Link href="/privacy" className="hover:underline">Privacy</Link> ·{' '}
          <Link href="/support" className="hover:underline">Support</Link>
        </p>
      </footer>
    </div>
  );
}
