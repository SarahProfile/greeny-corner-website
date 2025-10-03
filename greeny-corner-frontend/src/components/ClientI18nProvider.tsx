'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

export default function ClientI18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && ['en', 'ar'].includes(savedLanguage)) {
      i18n.changeLanguage(savedLanguage);
      document.documentElement.lang = savedLanguage;
      document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}