'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { plantsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const currentLocale = i18n.language;

  const changeLanguage = async (locale: string) => {
    // Don't change if it's the same language
    if (locale === currentLocale) {
      setIsOpen(false);
      return;
    }

    i18n.changeLanguage(locale);
    localStorage.setItem('language', locale);
    setIsOpen(false);
    
    // Update HTML lang and dir attributes
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';

    // Refresh plant data for authenticated users
    if (user) {
      setRefreshing(true);
      try {
        console.log('Refreshing plants for language:', locale);
        await plantsAPI.refreshPlantsLanguage(locale);
        console.log('Plant language refresh completed');
        
        // Use router to navigate and trigger data refresh without full page reload
        // Only refresh if we're on a plant-related page
        const currentPath = window.location.pathname;
        if (currentPath.includes('/my-plants') || currentPath.includes('/add-plant')) {
          // Dispatch a custom event to notify components to refresh their data
          window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: locale } 
          }));
        }
      } catch (error) {
        console.error('Failed to refresh plant data:', error);
      } finally {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    // Set initial direction
    document.documentElement.dir = currentLocale === 'ar' ? 'rtl' : 'ltr';
  }, [currentLocale]);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          disabled={refreshing}
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="mr-2">{currentLanguage.flag}</span>
          {refreshing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('common.updating')}
            </>
          ) : (
            <>
              {currentLanguage.name}
              <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`${
                  currentLocale === language.code
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700'
                } flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100 hover:text-gray-900`}
              >
                <span className="mr-3">{language.flag}</span>
                {language.name}
                {currentLocale === language.code && (
                  <svg className="ml-auto h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}