'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useTranslation } from 'react-i18next';

const IOS_APP_URL = 'https://apps.apple.com/ae/app/greeny-corner/id6756967530';
const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.greenycorner.app';

export default function SupportPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="min-h-screen bg-green-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header showUserInfo={false} />

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            {t('support.title')}
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            {t('support.subtitle')}
          </p>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('support.contactUs')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('support.emailSupport')}</h3>
                <p className="text-gray-600 mt-1">{t('support.emailSupportDesc')}</p>
                <a href="mailto:support@greenycorner.ae" className="text-green-600 hover:text-green-700 font-medium mt-2 inline-block">
                  support@greenycorner.ae
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('support.responseTime')}</h3>
                <p className="text-gray-600 mt-1">{t('support.responseTimeDesc')}</p>
                <p className="text-green-600 font-medium mt-2">{t('support.responseTimeValue')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('support.faq')}</h2>

          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('support.faqQ1')}</h3>
              <p className="text-gray-600">{t('support.faqA1')}</p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('support.faqQ2')}</h3>
              <p className="text-gray-600">{t('support.faqA2')}</p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('support.faqQ3')}</h3>
              <p className="text-gray-600">
                {t('support.faqA3')}{' '}
                <Link href="/privacy" className="text-green-600 hover:underline">{t('footer.privacyPolicy')}</Link>.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('support.faqQ4')}</h3>
              <p className="text-gray-600">{t('support.faqA4')}</p>
            </div>

            <div className="pb-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('support.faqQ5')}</h3>
              <p className="text-gray-600">{t('support.faqA5')}</p>
            </div>
          </div>
        </div>

        {/* Quick Help Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('support.quickHelp')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-6 text-center hover:bg-green-100 transition-colors">
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('support.addFirstPlant')}</h3>
              <p className="text-sm text-gray-600">{t('support.addFirstPlantDesc')}</p>
            </div>

            <div className="bg-green-50 rounded-xl p-6 text-center hover:bg-green-100 transition-colors">
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('support.setUpReminders')}</h3>
              <p className="text-sm text-gray-600">{t('support.setUpRemindersDesc')}</p>
            </div>

            <div className="bg-green-50 rounded-xl p-6 text-center hover:bg-green-100 transition-colors">
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('support.careInstructions')}</h3>
              <p className="text-sm text-gray-600">{t('support.careInstructionsDesc')}</p>
            </div>
          </div>
        </div>

        {/* App Download Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">{t('support.downloadApp')}</h2>
          <p className="text-green-100 mb-6">{t('support.downloadAppDesc')}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href={IOS_APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-6 py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors">
              <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              {t('support.appStore')}
            </a>
            <a href={ANDROID_APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-6 py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors">
              <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
              </svg>
              {t('support.googlePlay')}
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>&copy; {t('support.copyright')}</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:text-green-600">{t('support.privacyPolicy')}</Link>
            <span>|</span>
            <Link href="/" className="hover:text-green-600">{t('support.home')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
