import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import PlantSearchAr from './PlantSearchAr';
import { SITE_URL } from '@/lib/site';

const API  = process.env.NEXT_PUBLIC_API_URL || 'https://api.greenycorner.ae/api';
const BASE = SITE_URL;

// Long window on purpose — this listing barely changes, and with 446K+ plant
// records behind it, every regeneration is expensive (Hobby plan CPU/ISR caps).
export const revalidate = 604800; // 7 days

interface PlantListItem {
  id: number;
  slug: string;
  name: string;
  name_ar?: string;
  scientific_name?: string;
  family?: string;
  image?: string;
  is_featured?: boolean;
  common_names?: string[];
  care_info?: { watering_interval_days?: number; difficulty?: string };
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
    const res = await fetch(`${API}/encyclopedia/plants?${qs}`, { next: { revalidate: 604800 } });
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
    const res = await fetch(`${API}/encyclopedia/featured`, { next: { revalidate: 604800 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'موسوعة النباتات — أكثر من 400,000 نبات | Greeny Corner',
    description: 'تصفح أكبر موسوعة نباتات مجانية. أدلة العناية وجداول الري والأسماء العلمية ونصائح الزراعة لأكثر من 400,000 نوع نباتي. ابحث عن أي نبات بالاسم.',
    keywords: 'موسوعة النباتات، دليل العناية بالنباتات، تعريف النباتات، كيفية زراعة النباتات، جدول الري، أسماء علمية، نباتات داخلية، نباتات خارجية',
    openGraph: {
      title: 'موسوعة النباتات — أكثر من 400,000 نبات | Greeny Corner',
      description: 'أدلة عناية مجانية وأسماء علمية ونصائح زراعة لأكثر من 400,000 نوع نباتي.',
      url: `${BASE}/ar/plants`,
      siteName: 'Greeny Corner',
      type: 'website',
    },
    alternates: {
      canonical: `${BASE}/ar/plants`,
      languages: {
        'ar':        `${BASE}/ar/plants`,
        'en':        `${BASE}/plants`,
        'x-default': `${BASE}/plants`,
      },
    },
  };
}

function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return null;
  const d = difficulty.toLowerCase();
  const label = d === 'easy' ? 'سهل' : d === 'hard' ? 'صعب' : 'متوسط';
  const color  = d === 'easy' ? 'bg-green-100 text-green-700' : d === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}

function PlantCard({ plant }: { plant: PlantListItem }) {
  const displayName = plant.name_ar || plant.name;
  return (
    <Link href={`/ar/plants/${plant.slug}`} className="group block bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
      <div className="relative h-44 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
        {plant.image ? (
          <img src={plant.image} alt={displayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🌿</div>
        )}
        {plant.is_featured && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">⭐ مميز</div>
        )}
      </div>
      <div className="p-4 text-right">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-0.5 line-clamp-1 group-hover:text-emerald-600 transition-colors">
          {displayName}
        </h3>
        {plant.common_names && plant.common_names.length > 0 && (
          <p className="text-xs text-emerald-700 font-medium mb-1 line-clamp-1">
            {plant.common_names.join(' · ')}
          </p>
        )}
        {plant.scientific_name && (
          <p className="text-xs text-gray-400 italic mb-2 line-clamp-1 text-left">{plant.scientific_name}</p>
        )}
        <div className="flex items-center justify-between gap-2 flex-wrap flex-row-reverse">
          {plant.family && (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{plant.family}</span>
          )}
          <DifficultyBadge difficulty={plant.care_info?.difficulty} />
        </div>
        {plant.care_info?.watering_interval_days && (
          <p className="text-xs text-gray-500 mt-2">💧 كل {plant.care_info.watering_interval_days} أيام</p>
        )}
      </div>
    </Link>
  );
}

export default async function ArabicPlantDirectoryPage({
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
    name: 'موسوعة النباتات',
    inLanguage: 'ar',
    description: `تصفح ${total.toLocaleString()}+ نبات مع أدلة العناية وجداول الري والتصنيف العلمي.`,
    url: `${BASE}/ar/plants`,
    numberOfItems: total,
    about: { '@type': 'Thing', name: 'النباتات', sameAs: 'https://en.wikipedia.org/wiki/Plant' },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'موسوعة النباتات', item: `${BASE}/ar/plants` },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50" dir="rtl" style={{ fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/ar/plants" className="text-emerald-600 font-semibold">موسوعة النباتات</Link>
            <Link href="/plants" className="text-gray-600 hover:text-emerald-600 font-medium" title="English version">English</Link>
            <Link href="/register" className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-600 transition-colors">التطبيق</Link>
          </nav>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/greeny-logo.svg" alt="Greeny Corner" width={120} height={36} className="h-9 w-auto" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🌱 موسوعة النباتات
          </h1>
          <p className="text-lg text-gray-600 mb-3">
            تصفح {total > 0 ? total.toLocaleString() + '+' : 'مئات الآلاف من'} النباتات مع أدلة عناية متخصصة
          </p>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto mb-2 leading-relaxed">
            ابحث عن أي نبات باسمه الشائع أو الاسم العلمي أو الفصيلة النباتية. كل صفحة تتضمن
            جداول الري ومتطلبات الإضاءة ومعلومات السمية والتصنيف — مصدرها{' '}
            <span className="font-medium text-gray-700">GBIF</span> و{' '}
            <span className="font-medium text-gray-700">Wikipedia</span> و{' '}
            <span className="font-medium text-gray-700">Perenual</span>.
          </p>
          <p className="text-xs text-gray-400 mb-8">
            🌿 سراخس · 🌵 صبار · 🌸 نباتات مزهرة · 🌳 أشجار · 🍃 نباتات استوائية · 🌾 أعشاب وأكثر
          </p>

          <div className="flex justify-center">
            <Suspense>
              <PlantSearchAr defaultValue={q} />
            </Suspense>
          </div>
        </div>

        {/* Family filter chips */}
        {families.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide flex-row-reverse">
            <Link
              href="/ar/plants"
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${!family ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'}`}
            >
              كل الفصائل
            </Link>
            {families.slice(0, 40).map(f => (
              <Link
                key={f}
                href={`/ar/plants?family=${encodeURIComponent(f)}`}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${family === f ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'}`}
              >
                {f}
              </Link>
            ))}
          </div>
        )}

        {/* Featured */}
        {featured.length > 0 && !isFiltered && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">⭐ النباتات المميزة</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {featured.map(plant => <PlantCard key={plant.id} plant={plant} />)}
            </div>
          </section>
        )}

        {/* Filter results heading */}
        {isFiltered && (
          <div className="flex items-center justify-between mb-6">
            <Link href="/ar/plants" className="text-sm text-emerald-600 hover:underline">مسح الفلاتر</Link>
            <p className="text-gray-600">
              {total.toLocaleString()} نتيجة
              {q ? ` لـ "${q}"` : ''}
              {family ? ` في ${family}` : ''}
            </p>
          </div>
        )}

        {/* All plants heading */}
        {!isFiltered && (
          <h2 className="text-2xl font-bold text-gray-900 mb-5">
            {family || 'كل النباتات'} <span className="text-base font-normal text-gray-400">({total.toLocaleString()})</span>
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
            <p className="text-xl text-gray-600 mb-2">لا توجد نتائج</p>
            <p className="text-gray-400 mb-6">جرّب كلمة بحث مختلفة أو تصفح كل النباتات</p>
            <Link href="/ar/plants" className="text-emerald-600 font-semibold hover:underline">← تصفح كل النباتات</Link>
          </div>
        )}

        {/* Pagination */}
        {last_page > 1 && (
          <div className="flex justify-center items-center gap-3 mt-12">
            {current_page < last_page && (
              <Link
                href={`/ar/plants?${new URLSearchParams({ ...fetchParams, page: String(current_page + 1) })}`}
                className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
              >
                التالي ←
              </Link>
            )}
            <span className="text-gray-600 font-medium">صفحة {current_page} من {last_page}</span>
            {current_page > 1 && (
              <Link
                href={`/ar/plants?${new URLSearchParams({ ...fetchParams, page: String(current_page - 1) })}`}
                className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-emerald-400 transition-colors"
              >
                → السابق
              </Link>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-10 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-3">تتبع نباتاتك 🌿</h2>
          <p className="text-emerald-100 mb-6 text-lg">
            لا تفوّت موعد الري. احصل على تذكيرات وفحوصات صحية بالذكاء الاصطناعي ونصائح عناية مخصصة.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-white text-emerald-700 font-bold px-8 py-3 rounded-2xl hover:bg-emerald-50 transition-colors shadow-md">
              ابدأ مجاناً
            </Link>
            <Link href="/plant-identifier" className="border-2 border-white text-white font-bold px-8 py-3 rounded-2xl hover:bg-white/10 transition-colors">
              تعرف على نبات
            </Link>
          </div>
        </div>
      </main>

    </div>
  );
}
