'use client';

import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export default function DebugTranslations() {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Translation Debug Page</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Language Settings</h2>
          <div className="space-y-2">
            <p><strong>Current Language:</strong> {i18n.language}</p>
            <p><strong>localStorage i18nextLng:</strong> {localStorage.getItem('i18nextLng')}</p>
            <p><strong>Available Languages:</strong> {i18n.languages.join(', ')}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Translations</h2>
          <div className="space-y-3">
            <div className="border-b pb-2">
              <p className="text-sm text-gray-600">plants.notifications</p>
              <p className="text-lg font-medium">{t('plants.notifications')}</p>
            </div>
            <div className="border-b pb-2">
              <p className="text-sm text-gray-600">plants.myGarden</p>
              <p className="text-lg font-medium">{t('plants.myGarden')}</p>
            </div>
            <div className="border-b pb-2">
              <p className="text-sm text-gray-600">plants.plantsCount</p>
              <p className="text-lg font-medium">{t('plants.plantsCount')}</p>
            </div>
            <div className="border-b pb-2">
              <p className="text-sm text-gray-600">plants.addPlant</p>
              <p className="text-lg font-medium">{t('plants.addPlant')}</p>
            </div>
            <div className="border-b pb-2">
              <p className="text-sm text-gray-600">plants.loading</p>
              <p className="text-lg font-medium">{t('plants.loading')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Language Switcher Test</h2>
          <div className="space-x-4">
            <button
              onClick={() => i18n.changeLanguage('en')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Switch to English
            </button>
            <button
              onClick={() => i18n.changeLanguage('ar')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Switch to Arabic
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">i18n Resource Check</h2>
          <div className="space-y-2">
            <p><strong>Has English Resources:</strong> {i18n.hasResourceBundle('en', 'common') ? 'Yes' : 'No'}</p>
            <p><strong>Has Arabic Resources:</strong> {i18n.hasResourceBundle('ar', 'common') ? 'Yes' : 'No'}</p>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Sample of loaded translations:</p>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(i18n.getResourceBundle(i18n.language, 'common')?.plants, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
