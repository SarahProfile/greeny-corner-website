'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plant, plantsAPI } from '@/lib/api';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useTranslation } from 'react-i18next';

interface CareItem {
  plant: Plant;
  type: 'watering' | 'fertilizing' | 'tilling';
  daysUntil: number;
  nextDate: string;
}

function getDaysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const next = new Date(dateStr);
  const today = new Date();
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function statusColor(days: number) {
  if (days < 0) return 'bg-red-100 border-red-300 text-red-700';
  if (days === 0) return 'bg-orange-100 border-orange-300 text-orange-700';
  if (days <= 2) return 'bg-yellow-100 border-yellow-300 text-yellow-700';
  return 'bg-emerald-100 border-emerald-300 text-emerald-700';
}

function careEmoji(type: string) {
  if (type === 'watering') return '💧';
  if (type === 'fertilizing') return '🌱';
  return '🪴';
}

export default function NotificationsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    plantsAPI.getPlants().then(setPlants).finally(() => setLoading(false));
  }, [user, authLoading]);

  const careItems: CareItem[] = [];
  for (const plant of plants) {
    if (!plant.care_schedule) continue;
    const wDays = getDaysUntil(plant.care_schedule.next_watering_date);
    if (wDays !== null) {
      careItems.push({ plant, type: 'watering', daysUntil: wDays, nextDate: plant.care_schedule.next_watering_date });
    }
    const fDays = getDaysUntil(plant.care_schedule.next_fertilizing_date);
    if (fDays !== null) {
      careItems.push({ plant, type: 'fertilizing', daysUntil: fDays, nextDate: plant.care_schedule.next_fertilizing_date! });
    }
    const tDays = getDaysUntil(plant.care_schedule.next_tilling_date);
    if (tDays !== null) {
      careItems.push({ plant, type: 'tilling', daysUntil: tDays, nextDate: plant.care_schedule.next_tilling_date! });
    }
  }

  careItems.sort((a, b) => a.daysUntil - b.daysUntil);

  const overdue = careItems.filter(i => i.daysUntil < 0);
  const today = careItems.filter(i => i.daysUntil === 0);
  const upcoming = careItems.filter(i => i.daysUntil > 0 && i.daysUntil <= 7);

  const formatDate = (d: string) => new Date(d).toLocaleDateString(isRTL ? 'ar-AE' : 'en-AE');

  const CareCard = ({ item }: { item: CareItem }) => {
    const plantName = item.plant.api_data?.name || item.plant.name;
    const typeLabel = t(`plants.careType${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`);
    return (
      <Link href={`/my-plants/${item.plant.id}`}>
        <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 hover:shadow-md transition-all ${statusColor(item.daysUntil)}`}>
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden bg-white shadow">
            <img src={item.plant.image_url} alt={plantName} className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = '/placeholder-plant.svg'; }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{plantName}</p>
            <p className="text-sm font-medium mt-0.5">
              {careEmoji(item.type)} {typeLabel}
            </p>
            <p className="text-xs mt-0.5 opacity-75">{formatDate(item.nextDate)}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            {item.daysUntil < 0 && (
              <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-full">
                {Math.abs(item.daysUntil)}d {isRTL ? 'متأخر' : 'late'}
              </span>
            )}
            {item.daysUntil === 0 && (
              <span className="text-xs font-bold bg-orange-500 text-white px-2 py-1 rounded-full">
                {isRTL ? 'اليوم' : 'Today'}
              </span>
            )}
            {item.daysUntil > 0 && (
              <span className="text-xs font-semibold opacity-75">
                {isRTL ? `${item.daysUntil}د` : `${item.daysUntil}d`}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />

      <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🔔 {t('notifications.plantsNeedingCare')}
          </h1>
          <Link href="/notifications/settings"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t('notifications.goToSettings')}
          </Link>
        </div>

        {careItems.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-emerald-100">
            <div className="text-6xl mb-4">🌿</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('notifications.allCaredFor')}</h2>
            <p className="text-gray-600">{t('notifications.allCaredForDesc')}</p>
            <Link href="/my-plants" className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all">
              {t('nav.myPlants')}
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {overdue.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">🚨</span>
                  {isRTL ? 'متأخر' : 'Overdue'} ({overdue.length})
                </h2>
                <div className="space-y-3">
                  {overdue.map((item, i) => <CareCard key={`${item.plant.id}-${item.type}-${i}`} item={item} />)}
                </div>
              </section>
            )}

            {today.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-orange-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">⏰</span>
                  {isRTL ? 'اليوم' : 'Due Today'} ({today.length})
                </h2>
                <div className="space-y-3">
                  {today.map((item, i) => <CareCard key={`${item.plant.id}-${item.type}-${i}`} item={item} />)}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-emerald-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  {isRTL ? 'قادم (7 أيام)' : 'Upcoming (7 days)'} ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map((item, i) => <CareCard key={`${item.plant.id}-${item.type}-${i}`} item={item} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
