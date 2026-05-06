import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.greenycorner.ae/api';

export const revalidate = 86400;

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

interface EncyclopediaPlant {
  id: number;
  slug: string;
  name: string;
  scientific_name?: string;
  family?: string;
  genus?: string;
  origin?: string;
  description?: string;
  common_names?: string[];
  care_info?: CareInfo;
  growth_info?: GrowthInfo;
  benefits?: string[];
  interesting_facts?: string[];
  toxicity?: string;
  images?: string[];
  wikipedia_url?: string;
  sources?: string[];
  is_featured?: boolean;
  view_count?: number;
  perenual_id?: number;
  gbif_id?: number;
}

interface SimilarPlant {
  id: number;
  slug: string;
  name: string;
  scientific_name?: string;
  image?: string;
  family?: string;
}

async function fetchPlant(slug: string): Promise<EncyclopediaPlant | null> {
  try {
    const res = await fetch(`${API}/encyclopedia/plants/${slug}`, { next: { revalidate: 86400 } });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchSimilar(slug: string): Promise<SimilarPlant[]> {
  try {
    const res = await fetch(`${API}/encyclopedia/plants/${slug}/similar`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const slugs: { slug: string }[] = [];
  try {
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(`${API}/encyclopedia/plants/slugs?page=${page}&limit=500`, { next: { revalidate: 86400 } });
      if (!res.ok) break;
      const data = await res.json();
      for (const item of data.data ?? []) {
        slugs.push({ slug: item.slug });
      }
      if (page >= (data.last_page ?? 1)) break;
    }
  } catch {}
  return slugs;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const plant = await fetchPlant(slug);

  if (!plant) {
    return { title: 'Plant Not Found | Greeny Corner' };
  }

  const title = plant.scientific_name
    ? `${plant.name} (${plant.scientific_name}) - Care Guide | Greeny Corner`
    : `${plant.name} - Plant Care Guide | Greeny Corner`;

  const description = plant.description
    ? plant.description.slice(0, 160).replace(/\s+/g, ' ').trim() + '...'
    : `Learn how to care for ${plant.name}. Watering schedule, light requirements, and expert growing tips.`;

  const image = plant.images?.[0];

  return {
    title,
    description,
    keywords: [plant.name, plant.scientific_name, plant.family, 'plant care', 'care guide', 'how to grow', 'watering'].filter(Boolean).join(', '),
    openGraph: {
      title,
      description,
      url: `https://greenycorner.ae/plants/${slug}`,
      siteName: 'Greeny Corner',
      type: 'article',
      images: image ? [{ url: image, alt: plant.name }] : [],
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : [] },
    alternates: { canonical: `https://greenycorner.ae/plants/${slug}` },
  };
}

function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return null;
  const d = difficulty.toLowerCase();
  const classes = d === 'easy' ? 'bg-green-100 text-green-700 border-green-200'
    : d === 'hard' ? 'bg-red-100 text-red-700 border-red-200'
    : 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${classes}`}>{difficulty}</span>;
}

function SourceBadge({ source }: { source: string }) {
  const labels: Record<string, string> = { perenual: '🌿 Perenual', gbif: '🔬 GBIF', wikipedia: '📖 Wikipedia' };
  return (
    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
      {labels[source] ?? source}
    </span>
  );
}

export default async function PlantDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [plant, similar] = await Promise.all([fetchPlant(slug), fetchSimilar(slug)]);

  if (!plant) notFound();

  const mainImage = plant.images?.[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${plant.name} - Plant Care Guide`,
    description: plant.description?.slice(0, 200),
    image: mainImage,
    author: { '@type': 'Organization', name: 'Greeny Corner', url: 'https://greenycorner.ae' },
    publisher: { '@type': 'Organization', name: 'Greeny Corner', url: 'https://greenycorner.ae', logo: 'https://greenycorner.ae/logo.png' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://greenycorner.ae/plants/${slug}` },
    ...(plant.care_info ? {
      hasPart: {
        '@type': 'HowTo',
        name: `How to care for ${plant.name}`,
        step: [
          plant.care_info.watering_interval_days && { '@type': 'HowToStep', text: `Water every ${plant.care_info.watering_interval_days} days` },
          plant.care_info.light && { '@type': 'HowToStep', text: `Light: ${plant.care_info.light}` },
          plant.care_info.humidity && { '@type': 'HowToStep', text: `Humidity: ${plant.care_info.humidity}` },
        ].filter(Boolean),
      },
    } : {}),
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
            <Link href="/register" className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-600 transition-colors">Get App</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-emerald-600">Home</Link>
          <span>›</span>
          <Link href="/plants" className="hover:text-emerald-600">Plants</Link>
          {plant.family && (
            <>
              <span>›</span>
              <Link href={`/plants?family=${encodeURIComponent(plant.family)}`} className="hover:text-emerald-600">{plant.family}</Link>
            </>
          )}
          <span>›</span>
          <span className="text-gray-800 font-medium">{plant.name}</span>
        </nav>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white aspect-square lg:aspect-auto lg:min-h-[480px]">
            {mainImage ? (
              <img src={mainImage} alt={plant.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 text-9xl min-h-[300px]">🌿</div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            {/* Name */}
            <div className="bg-white rounded-3xl shadow-xl p-7 border border-emerald-100">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">{plant.name}</h1>
              {plant.scientific_name && (
                <p className="text-lg italic text-gray-500 mb-4">{plant.scientific_name}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {plant.family && <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">{plant.family}</span>}
                {plant.genus && <span className="bg-teal-100 text-teal-700 text-sm font-semibold px-3 py-1 rounded-full">Genus: {plant.genus}</span>}
                {plant.growth_info?.indoor === true && <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">🏠 Indoor</span>}
                {plant.growth_info?.indoor === false && <span className="bg-orange-100 text-orange-700 text-sm font-semibold px-3 py-1 rounded-full">☀️ Outdoor</span>}
              </div>
              {plant.origin && (
                <p className="text-sm text-gray-600">📍 Origin: <span className="font-medium text-gray-800">{plant.origin}</span></p>
              )}
              {plant.sources && plant.sources.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {plant.sources.map(s => <SourceBadge key={s} source={s} />)}
                </div>
              )}
            </div>

            {/* Care Info */}
            {plant.care_info && (
              <div className="bg-white rounded-3xl shadow-xl p-7 border border-emerald-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🌱 Care Guide
                  <DifficultyBadge difficulty={plant.care_info.difficulty} />
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {plant.care_info.watering_interval_days && (
                    <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600 mb-1">💧 Watering</p>
                      <p className="text-sm font-bold text-blue-900">Every {plant.care_info.watering_interval_days} days</p>
                    </div>
                  )}
                  {plant.care_info.light && (
                    <div className="bg-yellow-50 rounded-2xl p-3 border border-yellow-100">
                      <p className="text-xs font-semibold text-yellow-600 mb-1">☀️ Light</p>
                      <p className="text-sm font-bold text-yellow-900 line-clamp-2">{plant.care_info.light}</p>
                    </div>
                  )}
                  {plant.care_info.humidity && (
                    <div className="bg-cyan-50 rounded-2xl p-3 border border-cyan-100">
                      <p className="text-xs font-semibold text-cyan-600 mb-1">💨 Humidity</p>
                      <p className="text-sm font-bold text-cyan-900">{plant.care_info.humidity}</p>
                    </div>
                  )}
                  {plant.care_info.temperature && (
                    <div className="bg-red-50 rounded-2xl p-3 border border-red-100">
                      <p className="text-xs font-semibold text-red-600 mb-1">🌡️ Temperature</p>
                      <p className="text-sm font-bold text-red-900">{plant.care_info.temperature}</p>
                    </div>
                  )}
                  {plant.care_info.soil && (
                    <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100">
                      <p className="text-xs font-semibold text-amber-600 mb-1">🪴 Soil</p>
                      <p className="text-sm font-bold text-amber-900">{plant.care_info.soil}</p>
                    </div>
                  )}
                  {plant.care_info.pruning && (
                    <div className="bg-green-50 rounded-2xl p-3 border border-green-100">
                      <p className="text-xs font-semibold text-green-600 mb-1">✂️ Pruning</p>
                      <p className="text-sm font-bold text-green-900">{plant.care_info.pruning}</p>
                    </div>
                  )}
                </div>
                {plant.care_info.care_tips && (
                  <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-xl p-3">💡 {plant.care_info.care_tips}</p>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-white">
              <p className="font-bold text-lg mb-1">Track this plant 🌿</p>
              <p className="text-emerald-100 text-sm mb-4">Get watering reminders & AI health checks</p>
              <div className="flex gap-3">
                <Link
                  href={`/add-plant?name=${encodeURIComponent(plant.name)}`}
                  className="flex-1 bg-white text-emerald-700 font-bold py-2.5 px-4 rounded-2xl text-center hover:bg-emerald-50 transition-colors shadow-md text-sm"
                >
                  Add to My Garden
                </Link>
                <Link
                  href="/register"
                  className="flex-1 border-2 border-white text-white font-bold py-2.5 px-4 rounded-2xl text-center hover:bg-white/10 transition-colors text-sm"
                >
                  Sign Up Free
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {plant.description && (
          <section className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 About {plant.name}</h2>
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
              {plant.description.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="mb-3">{para}</p>
              ))}
            </div>
            {plant.wikipedia_url && (
              <a href={plant.wikipedia_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-4">
                📖 Read more on Wikipedia ↗
              </a>
            )}
          </section>
        )}

        {/* Growth Info + Benefits + Facts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {plant.growth_info && Object.values(plant.growth_info).some(Boolean) && (
            <section className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📏 Growth Information</h2>
              <div className="space-y-3">
                {plant.growth_info.growth_rate && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">Growth Rate</span>
                    <span className="font-semibold text-gray-800">{plant.growth_info.growth_rate}</span>
                  </div>
                )}
                {(plant.growth_info.mature_height || plant.growth_info.mature_size) && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">Mature Size</span>
                    <span className="font-semibold text-gray-800">{plant.growth_info.mature_height || plant.growth_info.mature_size}</span>
                  </div>
                )}
                {plant.growth_info.spread && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">Spread</span>
                    <span className="font-semibold text-gray-800">{plant.growth_info.spread}</span>
                  </div>
                )}
                {plant.growth_info.cycle && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">Cycle</span>
                    <span className="font-semibold text-gray-800">{plant.growth_info.cycle}</span>
                  </div>
                )}
                {plant.growth_info.type && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 text-sm">Type</span>
                    <span className="font-semibold text-gray-800">{plant.growth_info.type}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {plant.common_names && plant.common_names.length > 0 && (
            <section className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🏷️ Also Known As</h2>
              <div className="flex flex-wrap gap-2">
                {plant.common_names.map((name, i) => (
                  <span key={i} className="bg-emerald-50 text-emerald-800 text-sm font-medium px-3 py-1.5 rounded-full border border-emerald-100">{name}</span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Benefits */}
        {plant.benefits && plant.benefits.length > 0 && (
          <section className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">✨ Benefits</h2>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💡 Interesting Facts</h2>
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

        {/* Toxicity Warning */}
        {plant.toxicity && (
          <section className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-3 flex items-center gap-2">⚠️ Safety Information</h2>
            <p className="text-amber-800 leading-relaxed">{plant.toxicity}</p>
          </section>
        )}

        {/* Similar Plants */}
        {similar.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">🌿 Similar Plants</h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
              {similar.map(s => (
                <Link key={s.id} href={`/plants/${s.slug}`} className="flex-shrink-0 w-40 group">
                  <div className="h-32 rounded-2xl overflow-hidden bg-emerald-50 mb-2">
                    {s.image ? (
                      <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors line-clamp-1">{s.name}</p>
                  {s.scientific_name && <p className="text-xs text-gray-400 italic line-clamp-1">{s.scientific_name}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-10 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-3">Ready to grow {plant.name}? 🌱</h2>
          <p className="text-emerald-100 mb-6">Track it in Greeny Corner — get watering reminders, AI health checks, and care tips.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-white text-emerald-700 font-bold px-8 py-3 rounded-2xl hover:bg-emerald-50 transition-colors shadow-md">
              Get Started Free
            </Link>
            <Link href="/plants" className="border-2 border-white text-white font-bold px-8 py-3 rounded-2xl hover:bg-white/10 transition-colors">
              Browse More Plants
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
