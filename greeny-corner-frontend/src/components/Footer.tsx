'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const IOS_APP_URL = 'https://apps.apple.com/ae/app/greeny-corner/id6756967530';
const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.greenycorner.app';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/">
              <img src="/greeny-logo.svg" alt="Greeny Corner" className="h-12 w-auto mb-3" />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              {t('footer.links')}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/my-plants" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  {t('footer.myPlants')}
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  {t('footer.signIn')}
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  {t('footer.createAccount')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Download App */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              {t('footer.getTheApp')}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {t('footer.downloadDesc')}
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={IOS_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-xs rounded-xl hover:bg-gray-800 transition-colors"
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
                href={ANDROID_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-xs rounded-xl hover:bg-gray-800 transition-colors"
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

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Greeny Corner. {t('footer.allRightsReserved')}
          </p>
          <p className="text-xs text-gray-400">
            {t('footer.madeWith')}
          </p>
        </div>
      </div>
    </footer>
  );
}
