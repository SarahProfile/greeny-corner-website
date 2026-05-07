'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useTranslation } from 'react-i18next';
import { notificationService } from '@/lib/notifications';

interface NotifSettings {
  enabled: boolean;
  wateringReminders: boolean;
  fertilizingReminders: boolean;
  tillingReminders: boolean;
  dailySummary: boolean;
  advanceNotice: number;
  reminderTime: string;
}

const defaultSettings: NotifSettings = {
  enabled: true,
  wateringReminders: true,
  fertilizingReminders: true,
  tillingReminders: true,
  dailySummary: false,
  advanceNotice: 0,
  reminderTime: '09:00',
};

const STORAGE_KEY = 'greeny_notif_settings';

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotifSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings({ ...defaultSettings, ...JSON.parse(stored) });
    } catch {}
  }, [user, authLoading]);

  const update = <K extends keyof NotifSettings>(key: K, value: NotifSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    if (notificationService.canSendNotifications()) {
      notificationService.sendTestNotification?.();
    } else {
      alert(isRTL ? 'الإشعارات غير مفعلة في المتصفح' : 'Notifications not enabled in browser');
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-emerald-500' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  const advanceOptions = [
    { value: 0, label: t('notifications.sameDay') },
    { value: 1, label: t('notifications.oneDayBefore') },
    { value: 2, label: t('notifications.twoDaysBefore') },
    { value: 3, label: t('notifications.threeDaysBefore') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />

      <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
        {/* Back */}
        <div className="mb-6">
          <Link href="/notifications" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
            {t('notifications.plantsNeedingCare')}
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          ⚙️ {t('notifications.settingsTitle')}
        </h1>

        <div className="space-y-4">
          {/* Master toggle */}
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 text-lg">{t('notifications.settingsTitle')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('plants.notificationDescription')}</p>
              </div>
              <Toggle checked={settings.enabled} onChange={v => update('enabled', v)} />
            </div>
          </div>

          {/* Reminder toggles */}
          <div className={`bg-white rounded-3xl shadow-xl p-6 border border-emerald-100 space-y-5 transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {[
              { key: 'wateringReminders', label: t('notifications.wateringReminders'), emoji: '💧' },
              { key: 'fertilizingReminders', label: t('notifications.fertilizingReminders'), emoji: '🌱' },
              { key: 'tillingReminders', label: t('notifications.tillingReminders'), emoji: '🪴' },
              { key: 'dailySummary', label: t('notifications.dailySummary'), emoji: '📋', desc: t('notifications.dailySummaryDesc') },
            ].map(({ key, label, emoji, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{label}</p>
                    {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
                  </div>
                </div>
                <Toggle
                  checked={settings[key as keyof NotifSettings] as boolean}
                  onChange={v => update(key as keyof NotifSettings, v)}
                />
              </div>
            ))}
          </div>

          {/* Advance notice */}
          <div className={`bg-white rounded-3xl shadow-xl p-6 border border-emerald-100 transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <p className="font-bold text-gray-900 mb-4">{t('notifications.advanceNotice')}</p>
            <div className="grid grid-cols-2 gap-3">
              {advanceOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => update('advanceNotice', opt.value)}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                    settings.advanceNotice === opt.value
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder time */}
          <div className={`bg-white rounded-3xl shadow-xl p-6 border border-emerald-100 transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="font-bold text-gray-900 mb-3 block">{t('notifications.reminderTime')}</label>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={e => update('reminderTime', e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-semibold"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl shadow-lg transition-all"
          >
            {saved ? `✅ ${t('notifications.settingsSaved')}` : t('notifications.saveSettings')}
          </button>

          {/* Test notification */}
          <button
            onClick={handleTest}
            className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-all"
          >
            🔔 {t('notifications.testNotification')}
          </button>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
