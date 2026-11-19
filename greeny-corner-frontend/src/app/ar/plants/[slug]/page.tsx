import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { SITE_URL } from '@/lib/site';

const API  = process.env.NEXT_PUBLIC_API_URL || 'https://api.greenycorner.ae/api';
const BASE = SITE_URL;

// Long window on purpose — a plant's reference info basically never changes,
// and with 446K+ records, every regeneration is expensive (Hobby plan CPU/ISR caps).
export const revalidate = 604800; // 7 days

// ── Arabic UI strings ─────────────────────────────────────────────────────────

const AR = {
  home:            'الرئيسية',
  plants:          'النباتات',
  getApp:          'احصل على التطبيق',
  careGuide:       'دليل العناية',
  easy:            'سهل',
  moderate:        'متوسط',
  hard:            'صعب',
  watering:        '💧 الري',
  light:           '☀️ الإضاءة',
  humidity:        '💨 الرطوبة',
  temperature:     '🌡️ درجة الحرارة',
  soil:            '🪴 التربة',
  pruning:         '✂️ التقليم',
  tips:            '💡',
  indoor:          '🏠 نبات داخلي',
  outdoor:         '☀️ نبات خارجي',
  origin:          '📍 الموطن الأصلي',
  addToGarden:     'أضف إلى حديقتي',
  signUpFree:      'سجّل مجاناً',
  trackPlant:      'تتبع هذا النبات 🌿',
  trackDesc:       'احصل على تذكيرات الري وفحوصات صحية بالذكاء الاصطناعي',
  aboutPlant:      (n: string) => `عن نبات ${n}`,
  readWiki:        '📖 اقرأ المزيد على ويكيبيديا ↗',
  commonNames:     (n: string) => `الأسماء الشائعة لنبات ${n}`,
  commonNamesDesc: (a: string, b: string) => `سواء كنت تبحث عن "${a}"${b ? ` أو "${b}"` : ''}، فكلها تشير إلى نفس النوع.`,
  growthInfo:      '📏 معلومات النمو',
  growthRate:      'معدل النمو',
  matureSize:      'الحجم الكامل',
  spread:          'الانتشار',
  lifecycle:       'دورة الحياة',
  type:            'النوع',
  benefits:        '✨ الفوائد',
  facts:           '💡 حقائق مثيرة للاهتمام',
  safety:          '⚠️ معلومات الأمان',
  similarPlants:   '🌿 نباتات مشابهة',
  classification:  '🔬 التصنيف النباتي',
  kingdom:         'المملكة',
  family:          'الفصيلة',
  genus:           'الجنس',
  species:         'النوع',
  originLabel:     'الموطن',
  typeLabel:       'النوع',
  lifecycleLabel:  'دورة الحياة',
  growthRateLabel: 'معدل النمو',
  faqTitle:        '❓ أسئلة شائعة',
  readyToGrow:     (n: string) => `هل أنت مستعد لزراعة ${n}؟ 🌱`,
  readyDesc:       'تتبعه في تطبيق Greeny Corner — احصل على تذكيرات الري وفحوصات صحية بالذكاء الاصطناعي ونصائح العناية.',
  getStarted:      'ابدأ مجاناً',
  browsePlants:    'تصفح المزيد من النباتات',
  madeForPlants:   'صُنع لعشاق النباتات',
  encyclopedia:    'موسوعة النباتات',
  privacy:         'الخصوصية',
  support:         'الدعم',
  everyDays:       (n: number) => `كل ${n} أيام`,
  plantedAE:       'Greeny Corner',
  switchToEn:      'English',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface CareInfo {
  watering_interval_days?: number;
  watering?: string;
  light?: string;
  humidity?: string;
  temperature?: string;
  care_tips?: string;
  difficulty?: string;
  soil?: string;
  pruning?: string;
}

interface GrowthInfo {
  growth_rate?: string;
  mature_height?: string;
  mature_size?: string;
  spread?: string;
  growth_habit?: string;
  indoor?: boolean;
  cycle?: string;
  type?: string;
}

interface Plant {
  id: number;
  slug: string;
  name: string;
  name_ar?: string;
  scientific_name?: string;
  family?: string;
  genus?: string;
  origin?: string;
  description?: string;
  description_ar?: string;
  common_names?: string[];
  care_info?: CareInfo;
  growth_info?: GrowthInfo;
  benefits?: string[];
  interesting_facts?: string[];
  toxicity?: string;
  images?: string[];
  wikipedia_url?: string;
  sources?: string[];
}

interface SimilarPlant {
  id: number;
  slug: string;
  name: string;
  name_ar?: string;
  scientific_name?: string;
  image?: string;
  family?: string;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchPlant(slug: string): Promise<Plant | null> {
  try {
    const res = await fetch(`${API}/encyclopedia/plants/${slug}`, { next: { revalidate: 604800 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchSimilar(slug: string): Promise<SimilarPlant[]> {
  try {
    const res = await fetch(`${API}/encyclopedia/plants/${slug}/similar`, { next: { revalidate: 604800 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// Pre-renders only the first page (500 plants) at build time — the encyclopedia
// has 446K+ records, and this ran for 5 pages (2,500 pages, x2 with the English
// route) on every single deploy. The rest of the catalog still works fine: any
// slug not in this set renders on first visit and gets cached from then on
// (dynamicParams defaults to true), it just isn't pre-built on every deploy.
export async function generateStaticParams() {
  const slugs: { slug: string }[] = [];
  try {
    for (let page = 1; page <= 1; page++) {
      const res = await fetch(`${API}/encyclopedia/plants/slugs?page=${page}&limit=500`, { next: { revalidate: 86400 } });
      if (!res.ok) break;
      const data = await res.json();
      for (const item of data.data ?? []) slugs.push({ slug: item.slug });
      if (page >= (data.last_page ?? 1)) break;
    }
  } catch {}
  return slugs;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const plant = await fetchPlant(slug);
  if (!plant) return { title: 'النبات غير موجود | Greeny Corner' };

  const displayName  = plant.name_ar || plant.name;
  const description  = plant.description_ar || plant.description || '';
  const metaDesc     = description
    ? description.slice(0, 155).replace(/\s+/g, ' ').trim() + '...'
    : `تعرف على طريقة العناية بنبات ${displayName}. جدول الري ومتطلبات الإضاءة ونصائح الزراعة.`;

  const title = plant.scientific_name
    ? `${displayName} (${plant.scientific_name}) - دليل العناية | Greeny Corner`
    : `${displayName} - دليل العناية بالنبات | Greeny Corner`;

  const image = plant.images?.[0];

  return {
    title,
    description: metaDesc,
    keywords: [displayName, plant.name, plant.scientific_name, plant.family, 'دليل العناية', 'نبات', 'كيفية زراعة'].filter(Boolean).join(', '),
    openGraph: { title, description: metaDesc, url: `${BASE}/ar/plants/${slug}`, siteName: 'Greeny Corner', type: 'article', images: image ? [{ url: image, alt: displayName }] : [] },
    twitter:   { card: 'summary_large_image', title, description: metaDesc, images: image ? [image] : [] },
    alternates: {
      canonical: `${BASE}/ar/plants/${slug}`,
      languages: {
        'ar':        `${BASE}/ar/plants/${slug}`,
        'en':        `${BASE}/plants/${slug}`,
        'x-default': `${BASE}/plants/${slug}`,
      },
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ArabicPlantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [plant, similar] = await Promise.all([fetchPlant(slug), fetchSimilar(slug)]);
  if (!plant) notFound();

  const displayName = plant.name_ar || plant.name;
  const description = plant.description_ar || plant.description;
  const mainImage   = plant.images?.[0];

  // Difficulty label in Arabic
  const difficultyAr = (d?: string) => {
    if (!d) return null;
    const dl = d.toLowerCase();
    return dl === 'easy' ? AR.easy : dl === 'hard' ? AR.hard : AR.moderate;
  };
  const difficultyClass = (d?: string) => {
    if (!d) return '';
    const dl = d.toLowerCase();
    return dl === 'easy' ? 'bg-green-100 text-green-700 border-green-200'
      : dl === 'hard' ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  // JSON-LD
  const articleLd = {
    '@context': 'https://schema.org',
    '@type':    'Article',
    headline:   `${displayName} - دليل العناية`,
    description: description?.slice(0, 200),
    image:      mainImage,
    inLanguage: 'ar',
    about: {
      '@type':       'Thing',
      name:          displayName,
      alternateName: [plant.name, ...(plant.common_names ?? [])],
      ...(plant.scientific_name ? { sameAs: `https://en.wikipedia.org/wiki/${encodeURIComponent(plant.scientific_name.replace(/ /g, '_'))}` } : {}),
    },
    author:            { '@type': 'Organization', name: 'Greeny Corner', url: BASE },
    publisher:         { '@type': 'Organization', name: 'Greeny Corner', url: BASE },
    mainEntityOfPage:  { '@type': 'WebPage', '@id': `${BASE}/ar/plants/${slug}` },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: AR.home,   item: `${BASE}/ar` },
      { '@type': 'ListItem', position: 2, name: AR.plants, item: `${BASE}/ar/plants` },
      { '@type': 'ListItem', position: 3, name: displayName, item: `${BASE}/ar/plants/${slug}` },
    ],
  };

  // FAQ in Arabic
  const faqs: { q: string; a: string }[] = [];

  faqs.push({
    q: `ما هو نبات ${displayName}؟`,
    a: description
      ? description.slice(0, 300) + (description.length > 300 ? '…' : '')
      : `${displayName} (${plant.scientific_name ?? plant.name}) نوع نباتي ينتمي إلى فصيلة ${plant.family || 'النباتات'}${plant.genus ? `، جنس ${plant.genus}` : ''}.`,
  });

  if (plant.scientific_name) {
    faqs.push({
      q: `ما هو الاسم العلمي لنبات ${displayName}؟`,
      a: `الاسم العلمي المقبول لنبات ${displayName} هو ${plant.scientific_name}${plant.family ? `، ينتمي إلى فصيلة ${plant.family}` : ''}.`,
    });
  }

  if (plant.family) {
    faqs.push({
      q: `ما هي الفصيلة التي ينتمي إليها نبات ${displayName}؟`,
      a: `ينتمي نبات ${displayName} إلى فصيلة ${plant.family}${plant.genus ? ` وجنس ${plant.genus}` : ''}. يستند هذا التصنيف إلى بيانات المرفق العالمي لمعلومات التنوع البيولوجي (GBIF).`,
    });
  }

  if (plant.care_info?.watering_interval_days) {
    faqs.push({
      q: `كم مرة يجب سقي نبات ${displayName}؟`,
      a: `يُسقى نبات ${displayName} كل ${plant.care_info.watering_interval_days} أيام تقريباً.${plant.care_info.light ? ` يُفضّل ${plant.care_info.light}.` : ''} تحقق دائماً من التربة قبل الري — دع الطبقة العلوية تجف أولاً.`,
    });
  } else {
    faqs.push({
      q: `كيف أعتني بنبات ${displayName}؟`,
      a: `العناية بنبات ${displayName} تبدأ بفهم بيئته الطبيعية. اسقه عندما تشعر بجفاف سطح التربة، ووفّر له الإضاءة المناسبة. يوفر تطبيق Greeny Corner تذكيرات ري مخصصة لنبات ${displayName}.`,
    });
  }

  if (plant.common_names && plant.common_names.length > 0) {
    faqs.push({
      q: `ما هي الأسماء الأخرى لنبات ${displayName}؟`,
      a: `يُعرف نبات ${displayName} أيضاً بأسماء: ${plant.common_names.slice(0, 8).join('، ')}.`,
    });
  }

  const faqLd = {
    '@context':  'https://schema.org',
    '@type':     'FAQPage',
    mainEntity:  faqs.map(f => ({
      '@type':         'Question',
      name:            f.q,
      acceptedAnswer:  { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 font-sans" dir="rtl" style={{ fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-4 text-sm">
            <Link href={`/plants/${slug}`} className="text-gray-600 hover:text-emerald-600 font-medium" title="English version">English</Link>
            <Link href="/ar/plants" className="text-emerald-600 font-semibold">{AR.encyclopedia}</Link>
            <Link href="/register" className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-600 transition-colors">{AR.getApp}</Link>
          </nav>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/greeny-logo.svg" alt="Greeny Corner" width={120} height={36} className="h-9 w-auto" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-row-reverse justify-end">
          <span className="text-gray-800 font-medium">{displayName}</span>
          <span>‹</span>
          <Link href="/ar/plants" className="hover:text-emerald-600">{AR.plants}</Link>
          <span>‹</span>
          <Link href="/" className="hover:text-emerald-600">{AR.home}</Link>
        </nav>

        {/* Hero grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white aspect-square lg:aspect-auto lg:min-h-[480px]">
            {mainImage ? (
              <img src={mainImage} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 text-9xl min-h-[300px]">🌿</div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            {/* Name card */}
            <div className="bg-white rounded-3xl shadow-xl p-7 border border-emerald-100">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">{displayName}</h1>
              {plant.scientific_name && (
                <p className="text-lg italic text-gray-500 mb-2">{plant.scientific_name}</p>
              )}
              {plant.common_names && plant.common_names.length > 0 && (
                <p className="text-sm text-gray-500 mb-4">
                  <span className="font-semibold text-gray-600">يُعرف أيضاً بـ: </span>
                  {plant.common_names.slice(0, 5).join(' · ')}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {plant.family && <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">{plant.family}</span>}
                {plant.genus  && <span className="bg-teal-100 text-teal-700 text-sm font-semibold px-3 py-1 rounded-full">{plant.genus}</span>}
                {plant.growth_info?.indoor === true  && <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">{AR.indoor}</span>}
                {plant.growth_info?.indoor === false && <span className="bg-orange-100 text-orange-700 text-sm font-semibold px-3 py-1 rounded-full">{AR.outdoor}</span>}
              </div>
              {plant.origin && (
                <p className="text-sm text-gray-600">{AR.origin}: <span className="font-medium text-gray-800">{plant.origin}</span></p>
              )}
            </div>

            {/* Care Info */}
            {plant.care_info && (
              <div className="bg-white rounded-3xl shadow-xl p-7 border border-emerald-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🌱 {AR.careGuide}
                  {plant.care_info.difficulty && (
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${difficultyClass(plant.care_info.difficulty)}`}>
                      {difficultyAr(plant.care_info.difficulty)}
                    </span>
                  )}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {plant.care_info.watering_interval_days && (
                    <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600 mb-1">{AR.watering}</p>
                      <p className="text-sm font-bold text-blue-900">{AR.everyDays(plant.care_info.watering_interval_days)}</p>
                    </div>
                  )}
                  {plant.care_info.light && (
                    <div className="bg-yellow-50 rounded-2xl p-3 border border-yellow-100">
                      <p className="text-xs font-semibold text-yellow-600 mb-1">{AR.light}</p>
                      <p className="text-sm font-bold text-yellow-900 line-clamp-2">{plant.care_info.light}</p>
                    </div>
                  )}
                  {plant.care_info.humidity && (
                    <div className="bg-cyan-50 rounded-2xl p-3 border border-cyan-100">
                      <p className="text-xs font-semibold text-cyan-600 mb-1">{AR.humidity}</p>
                      <p className="text-sm font-bold text-cyan-900">{plant.care_info.humidity}</p>
                    </div>
                  )}
                  {plant.care_info.temperature && (
                    <div className="bg-red-50 rounded-2xl p-3 border border-red-100">
                      <p className="text-xs font-semibold text-red-600 mb-1">{AR.temperature}</p>
                      <p className="text-sm font-bold text-red-900">{plant.care_info.temperature}</p>
                    </div>
                  )}
                  {plant.care_info.soil && (
                    <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100">
                      <p className="text-xs font-semibold text-amber-600 mb-1">{AR.soil}</p>
                      <p className="text-sm font-bold text-amber-900">{plant.care_info.soil}</p>
                    </div>
                  )}
                  {plant.care_info.pruning && (
                    <div className="bg-green-50 rounded-2xl p-3 border border-green-100">
                      <p className="text-xs font-semibold text-green-600 mb-1">{AR.pruning}</p>
                      <p className="text-sm font-bold text-green-900">{plant.care_info.pruning}</p>
                    </div>
                  )}
                </div>
                {plant.care_info.care_tips && (
                  <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-xl p-3">{AR.tips} {plant.care_info.care_tips}</p>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-white">
              <p className="font-bold text-lg mb-1">{AR.trackPlant}</p>
              <p className="text-emerald-100 text-sm mb-4">{AR.trackDesc}</p>
              <div className="flex gap-3">
                <Link href={`/add-plant?name=${encodeURIComponent(displayName)}`} className="flex-1 bg-white text-emerald-700 font-bold py-2.5 px-4 rounded-2xl text-center hover:bg-emerald-50 transition-colors shadow-md text-sm">
                  {AR.addToGarden}
                </Link>
                <Link href="/register" className="flex-1 border-2 border-white text-white font-bold py-2.5 px-4 rounded-2xl text-center hover:bg-white/10 transition-colors text-sm">
                  {AR.signUpFree}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <section className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{AR.aboutPlant(displayName)}</h2>
            <div className="text-gray-700 leading-relaxed space-y-3 text-right" dir="rtl">
              {description.split('\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            {plant.wikipedia_url && (
              <a href={plant.wikipedia_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-4">
                {AR.readWiki}
              </a>
            )}
          </section>
        )}

        {/* Common Names */}
        {plant.common_names && plant.common_names.length > 0 && (
          <section className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{AR.commonNames(displayName)}</h2>
            <p className="text-sm text-gray-500 mb-4">
              {AR.commonNamesDesc(plant.common_names[0], plant.common_names[1] ?? '')}
            </p>
            <div className="flex flex-wrap gap-2">
              {plant.common_names.map((name, i) => (
                <span key={i} className="bg-emerald-50 text-emerald-800 text-sm font-semibold px-3 py-1.5 rounded-full border border-emerald-100">{name}</span>
              ))}
            </div>
          </section>
        )}

        {/* Growth Info */}
        {plant.growth_info && Object.values(plant.growth_info).some(Boolean) && (
          <section className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{AR.growthInfo}</h2>
            <div className="space-y-3">
              {plant.growth_info.growth_rate && (
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="font-semibold text-gray-800">{plant.growth_info.growth_rate}</span>
                  <span className="text-gray-500 text-sm">{AR.growthRate}</span>
                </div>
              )}
              {(plant.growth_info.mature_height || plant.growth_info.mature_size) && (
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="font-semibold text-gray-800">{plant.growth_info.mature_height || plant.growth_info.mature_size}</span>
                  <span className="text-gray-500 text-sm">{AR.matureSize}</span>
                </div>
              )}
              {plant.growth_info.spread && (
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="font-semibold text-gray-800">{plant.growth_info.spread}</span>
                  <span className="text-gray-500 text-sm">{AR.spread}</span>
                </div>
              )}
              {plant.growth_info.cycle && (
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="font-semibold text-gray-800">{plant.growth_info.cycle}</span>
                  <span className="text-gray-500 text-sm">{AR.lifecycle}</span>
                </div>
              )}
              {plant.growth_info.type && (
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-gray-800">{plant.growth_info.type}</span>
                  <span className="text-gray-500 text-sm">{AR.type}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Benefits */}
        {plant.benefits && plant.benefits.length > 0 && (
          <section className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{AR.benefits}</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plant.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span> {b}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Interesting Facts */}
        {plant.interesting_facts && plant.interesting_facts.length > 0 && (
          <section className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{AR.facts}</h2>
            <ol className="space-y-3">
              {plant.interesting_facts.map((fact, i) => (
                <li key={i} className="flex gap-3 text-gray-700">
                  <span className="text-emerald-600 font-bold text-lg leading-snug">{i + 1}.</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Toxicity */}
        {plant.toxicity && (
          <section className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-3">{AR.safety}</h2>
            <p className="text-amber-800 leading-relaxed">{plant.toxicity}</p>
          </section>
        )}

        {/* Similar Plants */}
        {similar.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">{AR.similarPlants}</h2>
            <div className="flex gap-4 overflow-x-auto pb-3">
              {similar.map(s => (
                <Link key={s.id} href={`/ar/plants/${s.slug}`} className="flex-shrink-0 w-40 group">
                  <div className="h-32 rounded-2xl overflow-hidden bg-emerald-50 mb-2">
                    {s.image ? (
                      <img src={s.image} alt={s.name_ar || s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors line-clamp-1">{s.name_ar || s.name}</p>
                  {s.scientific_name && <p className="text-xs text-gray-400 italic line-clamp-1">{s.scientific_name}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Classification */}
        <section className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">{AR.classification}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: AR.kingdom,      value: 'Plantae' },
              plant.family             && { label: AR.family,        value: plant.family },
              plant.genus              && { label: AR.genus,         value: plant.genus },
              plant.scientific_name   && { label: AR.species,        value: plant.scientific_name },
              plant.origin             && { label: AR.originLabel,   value: plant.origin },
              plant.growth_info?.type && { label: AR.typeLabel,      value: plant.growth_info.type },
              plant.growth_info?.cycle && { label: AR.lifecycleLabel, value: plant.growth_info.cycle },
              plant.growth_info?.growth_rate && { label: AR.growthRateLabel, value: plant.growth_info.growth_rate },
            ].filter(Boolean).map((row: any) => (
              <div key={row.label} className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{row.label}</p>
                <p className="text-sm font-semibold text-gray-800 italic">{row.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{AR.faqTitle}</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group border border-gray-100 rounded-2xl overflow-hidden">
                <summary className="flex justify-between items-center px-5 py-4 cursor-pointer font-semibold text-gray-800 hover:bg-emerald-50 transition-colors list-none">
                  <span className="text-right">{faq.q}</span>
                  <span className="text-emerald-500 text-xl group-open:rotate-45 transition-transform flex-shrink-0 ms-4">+</span>
                </summary>
                <div className="px-5 pb-4 pt-1 text-gray-600 text-sm leading-relaxed border-t border-gray-50 text-right" dir="rtl">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-10 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-3">{AR.readyToGrow(displayName)}</h2>
          <p className="text-emerald-100 mb-6">{AR.readyDesc}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-white text-emerald-700 font-bold px-8 py-3 rounded-2xl hover:bg-emerald-50 transition-colors shadow-md">{AR.getStarted}</Link>
            <Link href="/ar/plants" className="border-2 border-white text-white font-bold px-8 py-3 rounded-2xl hover:bg-white/10 transition-colors">{AR.browsePlants}</Link>
          </div>
        </div>
      </main>

    </div>
  );
}
