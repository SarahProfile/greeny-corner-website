'use client';

import Link from 'next/link';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useTranslation } from 'react-i18next';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Greeny Corner',
  url: 'https://www.greenycorner.ae',
  logo: 'https://www.greenycorner.ae/greeny-logo.svg',
  description: 'AI-powered plant care and identification app for plant lovers in the UAE and worldwide.',
  sameAs: [
    'https://apps.apple.com/ae/app/greeny-corner/id6756967530',
    'https://play.google.com/store/apps/details?id=com.greenycorner.app',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: 'https://www.greenycorner.ae/support',
  },
};

const features = [
  { icon: '🌿', key: 'plantTracking', descKey: 'plantTrackingDesc' },
  { icon: '💧', key: 'waterReminders', descKey: 'waterRemindersDesc' },
  { icon: '🔬', key: 'careInsights', descKey: 'careInsightsDesc' },
  { icon: '🔔', key: 'smartNotifications', descKey: 'smartNotificationsDesc' },
];

const IOS_APP_URL = 'https://apps.apple.com/ae/app/greeny-corner/id6756967530';
const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.greenycorner.app';

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <>
    <Script id="about-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />

      <main className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
              <img src="/greeny-logo.svg" alt="Greeny Corner" className="h-20" style={{ width: 'auto' }} />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
            {t('app.title')}
          </h1>
          <p className="text-lg text-gray-600 mb-2">{t('about.tagline')}</p>
          <span className="inline-block bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">
            {t('about.version')}
          </span>
        </div>

        {/* Description */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-emerald-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <span className="text-3xl">🌱</span>
            {t('about.title')}
          </h2>
          <p className="text-gray-700 leading-relaxed text-lg">{t('about.description')}</p>
        </div>

        {/* Features */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-emerald-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="text-3xl">✨</span>
            {t('about.featuresTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.key} className="flex items-start gap-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                <span className="text-3xl flex-shrink-0">{f.icon}</span>
                <div>
                  <p className="font-bold text-gray-900">{t(`about.${f.key}`)}</p>
                  <p className="text-sm text-gray-600 mt-1">{t(`about.${f.descKey}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl shadow-xl p-8 mb-8 text-center text-white">
          <p className="text-xl font-bold mb-2">{t('support.downloadApp')}</p>
          <p className="text-emerald-100 mb-6 text-sm">{t('support.downloadAppDesc')}</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a href={IOS_APP_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-gray-900 rounded-2xl font-semibold text-sm hover:bg-gray-100 transition-colors shadow-lg">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              {t('footer.appStore')}
            </a>
            <a href={ANDROID_APP_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-gray-900 rounded-2xl font-semibold text-sm hover:bg-gray-100 transition-colors shadow-lg">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0">
                <path d="M3.18 23.76c.3.17.64.2.96.08l.1-.06 10.72-6.2-2.3-2.31-9.48 8.49zM.75 1.5C.44 1.83.25 2.3.25 2.9v18.2c0 .6.19 1.07.5 1.4l.08.07 10.2-10.2v-.24L.83 1.43l-.08.07zM20.6 10.4l-2.16-1.25-2.57 2.57 2.57 2.57 2.18-1.26c.62-.36.62-.95 0-1.31l-.02-.32zM4.14.24l10.72 6.2-2.3 2.3L3.08.26 4.14.24z"/>
              </svg>
              {t('footer.googlePlay')}
            </a>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-emerald-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="text-3xl">📬</span>
            {t('about.contactTitle')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <a href="mailto:support@greenycorner.ae" className="text-emerald-600 hover:text-emerald-700 font-medium">
                {t('about.email')}
              </a>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <span className="text-gray-700 font-medium">{t('about.website')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm space-y-1">
          <p>{t('about.copyright')}</p>
          <p>{t('about.madeWith')}</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">
              {t('footer.privacyPolicy')}
            </Link>
            <Link href="/support" className="text-emerald-600 hover:text-emerald-700">
              {t('support.title')}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
    </>
  );
}
