'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plant, plantsAPI } from '@/lib/api';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useTranslation } from 'react-i18next';

export default function MyPlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user, logout, isGuest, logoutGuest, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    console.log('🔍 MyPlants: Auth check - authLoading:', authLoading, 'user:', user ? 'exists' : 'null');

    if (authLoading) {
      console.log('⏳ MyPlants: Still loading auth, waiting...');
      return;
    }

    if (!user && !isGuest) {
      console.log('❌ MyPlants: No user found, redirecting to login');
      router.push('/login');
      return;
    }

    if (isGuest) {
      setLoading(false);
      return;
    }

    console.log('✅ MyPlants: User authenticated, fetching plants');
    fetchPlants();
  }, [user, isGuest, authLoading]);

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      fetchPlants();
    };
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  const fetchPlants = async () => {
    try {
      const data = await plantsAPI.getPlants();
      setPlants(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || t('plants.failedToLoad'));
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getNextWateringDate = (plant: Plant) => {
    if (plant.care_schedule?.next_watering_date) {
      return formatDate(plant.care_schedule.next_watering_date);
    }
    return t('plants.notSet');
  };

  const getDaysUntilWatering = (plant: Plant) => {
    if (!plant.care_schedule?.next_watering_date) return null;
    const next = new Date(plant.care_schedule.next_watering_date);
    const today = new Date();
    const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getWateringStatus = (plant: Plant) => {
    const days = getDaysUntilWatering(plant);
    if (days === null) return 'unknown';
    if (days < 0) return 'overdue';
    if (days === 0) return 'today';
    if (days <= 2) return 'soon';
    return 'good';
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"></div>
            <p className="mt-4 text-lg text-gray-600">{t('plants.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <Header />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-7xl mb-6">🌿</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Browsing as Guest</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md">
              Create an account to track your plants, set watering reminders, and never miss a care schedule.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg transition-all duration-200"
              >
                Create Account
              </Link>
              <button
                onClick={() => { logoutGuest(); router.push('/login'); }}
                className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
              >
                Sign In
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      <Header />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🌿 {t('plants.myGarden')}
              </h1>
              <p className="text-lg text-gray-600">
                {plants.length === 0
                  ? t('plants.startYourJourney')
                  : `${plants.length} ${plants.length === 1 ? t('plants.plant') : t('plants.plantsCount')}`
                }
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <Link
                href="/add-plant"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('plants.addPlant')}
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {plants.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-100 rounded-full mb-6">
              <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">{t('plants.noPlants')}</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{t('plants.noPlantsDescription')}</p>
            <Link
              href="/add-plant"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('plants.addFirstPlant')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plants.map((plant) => {
              const status = getWateringStatus(plant);
              const days = getDaysUntilWatering(plant);

              return (
                <Link
                  key={plant.id}
                  href={`/my-plants/${plant.id}`}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
                >
                  {/* Plant Image */}
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100">
                    <img
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      src={plant.image_url}
                      alt={plant.name}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-plant.svg';
                      }}
                    />

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      {status === 'overdue' && (
                        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {t('plants.overdue')}
                        </div>
                      )}
                      {status === 'today' && (
                        <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {t('plants.today')}
                        </div>
                      )}
                      {status === 'soon' && (
                        <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                          {t('plants.soon')}
                        </div>
                      )}
                      {status === 'good' && (
                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                          ✓ {t('plants.healthy')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plant Info */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {plant.name}
                    </h3>

                    {plant.scientific_name && (
                      <p className="text-sm text-gray-500 italic mb-3 line-clamp-1">
                        {plant.scientific_name}
                      </p>
                    )}

                    {/* Watering Info */}
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>
                        {days !== null ? (
                          days < 0 ? (
                            <span className="text-red-600 font-semibold">
                              {Math.abs(days)} {t('plants.daysOverdue')}
                            </span>
                          ) : days === 0 ? (
                            <span className="text-orange-600 font-semibold">{t('plants.waterToday')}</span>
                          ) : (
                            <span>{t('plants.in')} {days} {t('plants.days')}</span>
                          )
                        ) : (
                          <span className="text-gray-400">{t('plants.notSet')}</span>
                        )}
                      </span>
                    </div>

                    {/* Added Date */}
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      {t('plants.added')}: {formatDate(plant.added_at)}
                    </div>

                    {/* View Details Button */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="text-emerald-600 font-medium group-hover:text-emerald-700 flex items-center">
                        {t('plants.viewDetails')}
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <MobileBottomNav />
    </div>
  );
}
