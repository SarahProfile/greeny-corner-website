import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { androidUrl, cleanSource, detectPlatform, iosUrl } from './links';

export const metadata: Metadata = {
  title: 'Get the App',
  description: 'Download Greeny Corner, the AI plant identifier and plant care app, for iPhone and Android.',
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Get Greeny Corner',
    description: 'Identify plants, diagnose problems and never forget to water. Free on iPhone and Android.',
    url: 'https://www.greenycorner.ae/get',
    images: [{ url: 'https://www.greenycorner.ae/og-image.png', width: 1200, height: 630, alt: 'Greeny Corner' }],
  },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const COPY = {
  en: {
    dir: 'ltr' as const,
    title: 'Get Greeny Corner',
    sub: 'Identify any plant from a photo, diagnose what is wrong with it, and never forget to water again.',
    ios: 'Download on the App Store',
    android: 'Get it on Google Play',
    scan: 'On a computer? Scan this with your phone and we will open the right store.',
    free: 'Free · English & Arabic',
    switch: 'العربية',
  },
  ar: {
    dir: 'rtl' as const,
    title: 'حمّل جريني كورنر',
    sub: 'تعرّف على أي نبتة من صورة، وشخّص مشكلتها، ولا تنسَ الري مرة أخرى.',
    ios: 'حمّل من App Store',
    android: 'حمّل من Google Play',
    scan: 'تتصفح من الكمبيوتر؟ امسح الرمز بهاتفك وسنفتح لك المتجر المناسب.',
    free: 'مجاني · بالعربية والإنجليزية',
    switch: 'English',
  },
};

export default async function GetPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const src = cleanSource(params.src);
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get('user-agent') || '';
  const platform = detectPlatform(userAgent);

  // Phones go straight to their store. The log line is the click count (Vercel logs).
  if (platform !== 'other') {
    console.log(JSON.stringify({ event: 'smart_link_redirect', platform, src }));
    redirect(platform === 'ios' ? iosUrl(src) : androidUrl(src));
  }

  const langParam = Array.isArray(params.lang) ? params.lang[0] : params.lang;
  const acceptsArabic = /^\s*ar/i.test(requestHeaders.get('accept-language') || '');
  const lang = langParam === 'ar' || (langParam !== 'en' && acceptsArabic) ? 'ar' : 'en';
  const copy = COPY[lang];

  // The QR points back at this page so a phone is routed by its own OS.
  const qr = await QRCode.toString(`https://www.greenycorner.ae/get?src=${src === 'direct' ? 'qr' : src}`, {
    type: 'svg',
    margin: 1,
    width: 200,
    color: { dark: '#14532d', light: '#ffffff' },
  });

  const otherLang = lang === 'ar' ? 'en' : 'ar';
  const switchHref = `/get?lang=${otherLang}${src !== 'direct' ? `&src=${src}` : ''}`;

  return (
    <main dir={copy.dir} className="min-h-screen bg-green-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 text-center">
        <img src="/greeny-logo.svg" alt="Greeny Corner" className="mx-auto h-16 w-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-gray-900">{copy.title}</h1>
        <p className="mt-3 text-gray-600">{copy.sub}</p>
        <p className="mt-2 text-sm font-medium text-green-700">{copy.free}</p>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={iosUrl(src)}
            className="rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-700"
          >
            {copy.ios}
          </a>
          <a
            href={androidUrl(src)}
            className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
          >
            {copy.android}
          </a>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <div
            className="mx-auto w-44 h-44 [&>svg]:h-full [&>svg]:w-full"
            role="img"
            aria-label="QR code"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <p className="mt-3 text-sm text-gray-500">{copy.scan}</p>
        </div>

        <a href={switchHref} className="mt-6 inline-block text-sm text-green-700 hover:underline">
          {copy.switch}
        </a>
      </div>
    </main>
  );
}
