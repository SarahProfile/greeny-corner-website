'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Header from '@/components/Header';
import { useTranslation } from 'react-i18next';
import Script from 'next/script';

export default function Home() {
  const { user, loading, loginAsGuest } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const handleGuestAccess = () => {
    loginAsGuest();
    router.push('/my-plants');
  };

  useEffect(() => {
    if (!loading && user) {
      router.push('/my-plants');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('home.loading')}</div>
      </div>
    );
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Greeny Corner',
    description: 'AI-powered plant identification and care management app for plant lovers',
    url: 'https://www.greenycorner.ae',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'AED',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
    },
    author: {
      '@type': 'Organization',
      name: 'Greeny Corner',
      url: 'https://www.greenycorner.ae',
    },
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-green-50" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <Header showUserInfo={false} />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">{t('home.welcomeTo')}</span>
            <span className="block text-green-600">{t('home.greenyCorner')}</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            {t('home.description')}
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                href="/register"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10"
              >
                {t('home.getStarted')}
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                href="/login"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                {t('home.signIn')}
              </Link>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={handleGuestAccess}
              className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              {t('auth.browseAsGuest') || 'Browse as Guest'}
            </button>
          </div>

          {/* App Store + Google Play Download */}
          <div className="mt-8 flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-3">{t('home.alsoAvailableOn')}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="https://apps.apple.com/ae/app/greeny-corner/id6756967530"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white text-xs rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span>
                  <span className="block text-[10px] leading-tight opacity-75">{t('footer.downloadOn')}</span>
                  <span className="block text-sm font-semibold leading-tight">{t('footer.appStore')}</span>
                </span>
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.greenycorner.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white text-xs rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.18 23.76c.3.17.64.2.96.08l.1-.06 10.72-6.2-2.3-2.31-9.48 8.49zM.75 1.5C.44 1.83.25 2.3.25 2.9v18.2c0 .6.19 1.07.5 1.4l.08.07 10.2-10.2v-.24L.83 1.43l-.08.07zM20.6 10.4l-2.16-1.25-2.57 2.57 2.57 2.57 2.18-1.26c.62-.36.62-.95 0-1.31l-.02-.32zM4.14.24l10.72 6.2-2.3 2.3L3.08.26 4.14.24z"/>
                </svg>
                <span>
                  <span className="block text-[10px] leading-tight opacity-75">{t('footer.getItOn')}</span>
                  <span className="block text-sm font-semibold leading-tight">{t('footer.googlePlay')}</span>
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{t('home.plantIdentification')}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('home.plantIdentificationDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{t('home.plantCollection')}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('home.plantCollectionDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{t('home.careReminders')}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('home.careRemindersDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
