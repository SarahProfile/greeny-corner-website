'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

function applyDirection(lang: string) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

export default function ClientI18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && ['en', 'ar'].includes(savedLanguage)) {
      i18n.changeLanguage(savedLanguage);
      applyDirection(savedLanguage);
    }
    // Update dir whenever language changes dynamically
    i18n.on('languageChanged', applyDirection);
    return () => { i18n.off('languageChanged', applyDirection); };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}