'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plant, plantsAPI } from '@/lib/api';
import { notificationService } from '@/lib/notifications';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useTranslation } from 'react-i18next';
import { translatePlantValue } from '@/lib/plantTranslations';

interface PlantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PlantDetailPage({ params }: PlantDetailPageProps) {
  const { t, i18n } = useTranslation();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plantId, setPlantId] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [watering, setWatering] = useState(false);
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [newWateringInterval, setNewWateringInterval] = useState(7);
  const [updatingSchedule, setUpdatingSchedule] = useState(false);
  const [diseasesData, setDiseasesData] = useState<any>(null);
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [loadingDiseases, setLoadingDiseases] = useState(false);

  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setPlantId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    console.log('🔍 PlantDetail: Auth check - authLoading:', authLoading, 'user:', user ? 'exists' : 'null');

    // Wait for auth to finish loading
    if (authLoading) {
      console.log('⏳ PlantDetail: Still loading auth, waiting...');
      return;
    }

    if (!user) {
      console.log('❌ PlantDetail: No user found, redirecting to login');
      router.push('/login');
      return;
    }

    console.log('✅ PlantDetail: User authenticated, fetching plant data');
    if (plantId) {
      fetchPlant();
    }
  }, [user, authLoading, plantId]);

  useEffect(() => {
    if (plant?.care_schedule?.watering_interval_days) {
      setNewWateringInterval(plant.care_schedule.watering_interval_days);
    }
  }, [plant]);

  useEffect(() => {
    // Listen for language change events
    const handleLanguageChange = (event: CustomEvent) => {
      console.log('Language changed to:', event.detail.language);
      console.log('Refreshing plant detail data...');
      if (plantId) {
        fetchPlant(); // Refresh plant data when language changes
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, [plantId]);

  const fetchPlant = async () => {
    try {
      const data = await plantsAPI.getPlant(parseInt(plantId));
      setPlant(data);
      // Also fetch diseases and nutrition data
      fetchDiseasesAndNutrition();
    } catch (err: any) {
      setError(t('plantDetail.failedToFetch'));
    } finally {
      setLoading(false);
    }
  };

  const fetchDiseasesAndNutrition = async () => {
    setLoadingDiseases(true);
    try {
      const data = await plantsAPI.getDiseasesAndNutrition(parseInt(plantId));
      setDiseasesData(data.diseases);
      setNutritionData(data.nutrition);
    } catch (err: any) {
      console.error('Failed to fetch diseases and nutrition:', err);
    } finally {
      setLoadingDiseases(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDelete = async () => {
    if (!plant) return;

    setDeleting(true);
    try {
      await plantsAPI.deletePlant(plant.id);
      router.push('/my-plants');
    } catch (err: any) {
      setError(t('plantDetail.failedToDelete'));
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleWaterNow = async () => {
    if (!plant || !plant.care_schedule) return;

    setWatering(true);
    try {
      const response = await plantsAPI.waterPlant(plant.id);
      const updatedPlant = response.plant;
      setPlant(updatedPlant);

      // Schedule next notification
      const nextWateringDate = new Date(response.next_watering_date);
      if (notificationService.canSendNotifications()) {
        notificationService.scheduleWateringNotification(plant.name, plant.id, nextWateringDate);
      }

      // Show success message
      alert(t('plantDetail.wateringSuccess', { plantName: plant.name, nextDate: nextWateringDate.toLocaleDateString() }));

    } catch (err: any) {
      setError(err.response?.data?.message || t('plantDetail.failedToUpdate'));
    } finally {
      setWatering(false);
    }
  };

  const handleEditSchedule = () => {
    setShowEditSchedule(true);
  };

  const handleSaveSchedule = async () => {
    if (!plant || !plant.care_schedule) return;

    setUpdatingSchedule(true);
    try {
      const response = await plantsAPI.updateSchedule(plant.id, { watering_interval_days: newWateringInterval });
      const updatedPlant = response.plant;
      setPlant(updatedPlant);

      // Reschedule notifications with new interval
      const nextWateringDate = new Date(response.next_watering_date);
      if (notificationService.canSendNotifications()) {
        notificationService.scheduleWateringNotification(plant.name, plant.id, nextWateringDate);
      }

      setShowEditSchedule(false);
      alert(t('plantDetail.scheduleUpdateSuccess', { plantName: plant.name, interval: newWateringInterval }));

    } catch (err: any) {
      setError(err.response?.data?.message || t('plantDetail.failedToUpdate'));
    } finally {
      setUpdatingSchedule(false);
    }
  };

  const getRecommendedInterval = () => {
    if (plant?.api_data?.care_info?.watering_interval_days) {
      return plant.api_data.care_info.watering_interval_days;
    }
    return 7; // Default
  };

  const setRecommendedInterval = () => {
    const recommended = getRecommendedInterval();
    setNewWateringInterval(recommended);
  };

  const getDaysUntilWatering = () => {
    if (!plant?.care_schedule?.next_watering_date) return null;
    const next = new Date(plant.care_schedule.next_watering_date);
    const today = new Date();
    const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getWateringStatus = () => {
    const days = getDaysUntilWatering();
    if (days === null) return 'unknown';
    if (days < 0) return 'overdue';
    if (days === 0) return 'today';
    if (days <= 2) return 'soon';
    return 'good';
  };

  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 text-emerald-800';
      case 'sick':
        return 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300 text-red-800';
      case 'needs_care':
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 text-yellow-800';
      case 'dying':
        return 'bg-gradient-to-r from-red-100 to-red-50 border-red-400 text-red-900';
      default:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 text-gray-800';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return '🌿';
      case 'sick':
        return '🤒';
      case 'needs_care':
        return '⚠️';
      case 'dying':
        return '🥀';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <div className="text-lg font-medium text-gray-700">{t('plantDetail.loadingPlantDetails')}</div>
        </div>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <Header />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-lg">
              {error || t('plantDetail.plantNotFound')}
            </div>
            <div className="mt-6">
              <Link
                href="/my-plants"
                className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold transition-colors group"
              >
                <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('plantDetail.backToMyPlants')}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const wateringStatus = getWateringStatus();
  const daysUntil = getDaysUntilWatering();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
      `}</style>

      <Header />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
        {/* Back Button */}
        <div className="mb-6 animate-slideUp">
          <Link
            href="/my-plants"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold transition-all group"
          >
            <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('plantDetail.backToMyPlants')}
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slideUp">
          {/* Image Section */}
          <div className="group">
            <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-white">
              <img
                className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-110"
                src={plant.image_url}
                alt={plant.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-emerald-100">
              <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {plant.name}
              </h1>

              {(plant.scientific_name || plant.api_data?.scientific_name) && (
                <p className="text-lg italic text-gray-600 mb-4">
                  {plant.scientific_name || plant.api_data.scientific_name}
                </p>
              )}

              {plant.api_data?.description && (
                <p className="text-gray-700 leading-relaxed">{translatePlantValue(plant.api_data.description, i18n.language)}</p>
              )}
            </div>

            {/* Watering Status Card */}
            {plant.care_schedule && (
              <div className={`rounded-3xl shadow-xl p-6 border-2 transition-all duration-300 hover:shadow-2xl ${
                wateringStatus === 'overdue'
                  ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300'
                  : wateringStatus === 'today'
                  ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300'
                  : wateringStatus === 'soon'
                  ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300'
                  : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-4xl mr-4">
                      {wateringStatus === 'overdue' ? '🚨' : wateringStatus === 'today' ? '💧' : wateringStatus === 'soon' ? '⏰' : '✨'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {wateringStatus === 'overdue'
                          ? t('plants.overdueWatering')
                          : wateringStatus === 'today'
                          ? t('plants.waterToday')
                          : wateringStatus === 'soon'
                          ? t('plantDetail.waterInDays', { days: daysUntil, daysText: daysUntil === 1 ? t('common.day') : t('common.daysPlural') })
                          : t('plantDetail.waterInDays', { days: daysUntil, daysText: t('common.daysPlural') })}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(plant.care_schedule.next_watering_date)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleWaterNow}
                    disabled={watering}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {watering ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('plantDetail.wateringInProgress')}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        💧 {t('plantDetail.waterNow')}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleEditSchedule}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-800 font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-gray-200"
                  >
                    📅 {t('plantDetail.editSchedule')}
                  </button>
                </div>
              </div>
            )}

            {/* Health Status */}
            {plant.health_status && (
              <div className={`rounded-3xl shadow-xl p-6 border-2 ${getHealthStatusColor(plant.health_status)}`}>
                <div className="flex items-start">
                  <span className="text-4xl mr-4">{getHealthStatusIcon(plant.health_status)}</span>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">
                      {t('plantDetail.plantHealth')}: {t(`plantDetail.${plant.health_status.replace('_', '')}`)}
                    </h3>
                    {plant.last_health_check && (
                      <p className="text-sm opacity-75 mb-3">
                        {t('plantDetail.lastChecked')} {formatDateTime(plant.last_health_check)}
                      </p>
                    )}
                    {plant.health_notes && (
                      <div className="mt-3 p-3 bg-white/50 rounded-xl">
                        <p className="text-sm leading-relaxed">{plant.health_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                🗑️ {t('plantDetail.deletePlant')}
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Information Sections */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slideUp" style={{animationDelay: '0.2s'}}>
          {/* Plant Information */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-emerald-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">📋</span>
              {t('plantDetail.plantInformation')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-200">
                <dt className="text-sm font-semibold text-emerald-900 mb-2">{t('plantDetail.addedOn')}</dt>
                <dd className="text-sm text-emerald-700 font-medium">{formatDate(plant.added_at)}</dd>
              </div>

              {plant.api_data?.family && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-200">
                  <dt className="text-sm font-semibold text-purple-900 mb-2">{t('plantDetail.family')}</dt>
                  <dd className="text-sm text-purple-700 font-medium">{translatePlantValue(plant.api_data.family, i18n.language)}</dd>
                </div>
              )}

              {plant.api_data?.origin && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-2xl border border-blue-200">
                  <dt className="text-sm font-semibold text-blue-900 mb-2">{t('plantDetail.origin')}</dt>
                  <dd className="text-sm text-blue-700 font-medium">{translatePlantValue(plant.api_data.origin, i18n.language)}</dd>
                </div>
              )}

              {plant.api_data?.growth_info && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-200">
                  <dt className="text-sm font-semibold text-orange-900 mb-2">{t('plantDetail.matureSize')}</dt>
                  <dd className="text-sm text-orange-700 font-medium">{translatePlantValue(plant.api_data.growth_info.size, i18n.language)}</dd>
                </div>
              )}
            </div>

            {plant.api_data?.common_names && plant.api_data.common_names.length > 0 && (
              <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-200">
                <dt className="text-sm font-semibold text-indigo-900 mb-2">{t('plantDetail.alsoKnownAs')}</dt>
                <dd className="text-sm text-indigo-800 font-medium">
                  {plant.api_data.common_names.join(', ')}
                </dd>
              </div>
            )}
          </div>

          {/* Care Requirements */}
          {plant.api_data?.care_info && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-emerald-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">🌱</span>
                {t('plantDetail.careRequirements')}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-2xl border border-blue-200">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">💧</span>
                    <span className="text-sm font-semibold text-blue-900">{t('plantDetail.watering')}</span>
                  </div>
                  <p className="text-sm text-blue-700 font-medium">
                    {t('plantDetail.everyNDays', { days: plant.api_data.care_info.watering_interval_days })}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-2xl border border-yellow-200">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">☀️</span>
                    <span className="text-sm font-semibold text-yellow-900">{t('plantDetail.light')}</span>
                  </div>
                  <p className="text-sm text-yellow-700 font-medium">{translatePlantValue(plant.api_data.care_info.light, i18n.language)}</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-2xl border border-emerald-200">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">💨</span>
                    <span className="text-sm font-semibold text-emerald-900">{t('plantDetail.humidity')}</span>
                  </div>
                  <p className="text-sm text-emerald-700 font-medium">{translatePlantValue(plant.api_data.care_info.humidity, i18n.language)}</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-2xl border border-red-200">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🌡️</span>
                    <span className="text-sm font-semibold text-red-900">{t('plantDetail.temperature')}</span>
                  </div>
                  <p className="text-sm text-red-700 font-medium">{translatePlantValue(plant.api_data.care_info.temperature, i18n.language)}</p>
                </div>
              </div>

              {plant.api_data.care_info.care_tips && (
                <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-200">
                  <h4 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center">
                    <span className="text-xl mr-2">💡</span>
                    {t('plantDetail.careTips')}
                  </h4>
                  <p className="text-sm text-indigo-700 leading-relaxed">{translatePlantValue(plant.api_data.care_info.care_tips, i18n.language)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Additional Sections */}
        <div className="mt-8 space-y-8 animate-slideUp" style={{animationDelay: '0.4s'}}>
          {/* Growth Information */}
          {plant.api_data?.growth_info && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-emerald-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">📏</span>
                {t('plantDetail.growthInformation')}
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl text-center border border-green-200">
                  <div className="text-sm font-semibold text-green-900 mb-2">{t('plantDetail.growthRate')}</div>
                  <div className="text-lg text-green-700 font-bold">{translatePlantValue(plant.api_data.growth_info.growth_rate, i18n.language)}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl text-center border border-purple-200">
                  <div className="text-sm font-semibold text-purple-900 mb-2">{t('plantDetail.height')}</div>
                  <div className="text-lg text-purple-700 font-bold">{translatePlantValue(plant.api_data.growth_info.mature_height, i18n.language)}</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-2xl text-center border border-orange-200">
                  <div className="text-sm font-semibold text-orange-900 mb-2">{t('plantDetail.spread')}</div>
                  <div className="text-lg text-orange-700 font-bold">{translatePlantValue(plant.api_data.growth_info.spread, i18n.language)}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl text-center border border-blue-200">
                  <div className="text-sm font-semibold text-blue-900 mb-2">{t('plantDetail.growthHabit')}</div>
                  <div className="text-sm text-blue-700 font-bold leading-tight">{translatePlantValue(plant.api_data.growth_info.growth_habit, i18n.language)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Safety Information */}
          {plant.api_data?.toxicity && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-amber-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">⚠️</span>
                {t('plantDetail.safetyInformation')}
              </h3>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 p-6 rounded-2xl">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-amber-800 font-medium leading-relaxed">{plant.api_data.toxicity}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          {plant.api_data?.benefits && plant.api_data.benefits.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-emerald-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">✨</span>
                {t('plantDetail.plantBenefits')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plant.api_data.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200 hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-4">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-green-800 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interesting Facts */}
          {plant.api_data?.interesting_facts && plant.api_data.interesting_facts.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-indigo-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">💡</span>
                {t('plantDetail.didYouKnow')}
              </h3>
              <div className="space-y-4">
                {plant.api_data.interesting_facts.map((fact, index) => (
                  <div key={index} className="flex items-start bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-200 hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-4 mt-0.5">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm text-indigo-800 leading-relaxed">{fact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diseases and Protection */}
          {diseasesData && diseasesData.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-red-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">🦠</span>
                {t('plantDetail.commonDiseases')}
              </h3>
              <div className="space-y-6">
                {diseasesData.map((disease: any, index: number) => (
                  <div key={index} className="border border-red-200 rounded-2xl p-6 bg-gradient-to-br from-red-50 to-pink-50 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-bold text-red-900 mb-3 flex items-center">
                      <span className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3 text-white text-sm">{index + 1}</span>
                      {disease.name}
                    </h4>

                    {disease.description && (
                      <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                        {disease.description}
                      </p>
                    )}

                    {disease.symptoms && (
                      <div className="mb-3">
                        <span className="text-xs font-semibold text-orange-900 uppercase tracking-wide">{t('plantDetail.symptoms')}:</span>
                        <p className="text-sm text-orange-800 mt-1">{disease.symptoms}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {disease.prevention && (
                        <div className="bg-white rounded-xl p-4 border border-green-200">
                          <div className="flex items-center mb-2">
                            <span className="text-lg mr-2">🛡️</span>
                            <span className="text-xs font-semibold text-green-900 uppercase tracking-wide">{t('plantDetail.prevention')}</span>
                          </div>
                          <p className="text-sm text-green-800">{disease.prevention}</p>
                        </div>
                      )}

                      {disease.treatment && (
                        <div className="bg-white rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center mb-2">
                            <span className="text-lg mr-2">💊</span>
                            <span className="text-xs font-semibold text-blue-900 uppercase tracking-wide">{t('plantDetail.treatment')}</span>
                          </div>
                          <p className="text-sm text-blue-800">{disease.treatment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nutrition Requirements */}
          {nutritionData && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">🌱</span>
                {t('plantDetail.nutritionRequirements')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {nutritionData.primary_nutrients && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">⚗️</span>
                      <span className="text-sm font-bold text-green-900">{t('plantDetail.primaryNutrients')}</span>
                    </div>
                    <p className="text-sm text-green-800 leading-relaxed">{nutritionData.primary_nutrients}</p>
                  </div>
                )}

                {nutritionData.secondary_nutrients && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200">
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">🧪</span>
                      <span className="text-sm font-bold text-blue-900">{t('plantDetail.secondaryNutrients')}</span>
                    </div>
                    <p className="text-sm text-blue-800 leading-relaxed">{nutritionData.secondary_nutrients}</p>
                  </div>
                )}

                {nutritionData.fertilizer_type && (
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-200">
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">🧺</span>
                      <span className="text-sm font-bold text-amber-900">{t('plantDetail.fertilizerType')}</span>
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed">{nutritionData.fertilizer_type}</p>
                  </div>
                )}

                {nutritionData.feeding_frequency && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200">
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">📅</span>
                      <span className="text-sm font-bold text-purple-900">{t('plantDetail.feedingFrequency')}</span>
                    </div>
                    <p className="text-sm text-purple-800 leading-relaxed">{nutritionData.feeding_frequency}</p>
                  </div>
                )}

                {nutritionData.feeding_season && (
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border border-orange-200">
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">🌞</span>
                      <span className="text-sm font-bold text-orange-900">{t('plantDetail.feedingSeason')}</span>
                    </div>
                    <p className="text-sm text-orange-800 leading-relaxed">{nutritionData.feeding_season}</p>
                  </div>
                )}

                {nutritionData.special_notes && (
                  <div className="col-span-full bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-200">
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">📝</span>
                      <span className="text-sm font-bold text-indigo-900">{t('plantDetail.specialNotes')}</span>
                    </div>
                    <p className="text-sm text-indigo-800 leading-relaxed">{nutritionData.special_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {loadingDiseases && (
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200 text-center">
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-green-500 mr-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-600">{t('plantDetail.loadingDiseasesNutrition')}</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border-2 border-red-200 animate-slideUp">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-3xl">🗑️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t('plantDetail.deleteConfirmTitle')}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t('plantDetail.deleteConfirmMessage', { plantName: plant?.name })}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 border-2 border-gray-200"
              >
                {t('plantDetail.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 shadow-lg"
              >
                {deleting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('plantDetail.deleting')}
                  </span>
                ) : (
                  t('plantDetail.delete')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border-2 border-emerald-200 animate-slideUp">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-3xl">📅</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t('plantDetail.editWateringSchedule')}</h3>
                <p className="text-sm text-gray-600 mt-1">for {plant?.name}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {t('plantDetail.wateringIntervalDays')}
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={newWateringInterval}
                onChange={(e) => setNewWateringInterval(parseInt(e.target.value) || 1)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-semibold"
              />
              <p className="text-xs text-gray-500 mt-2">
                {t('plantDetail.current')} {plant?.care_schedule?.watering_interval_days} {t('plantDetail.days')}
              </p>
            </div>

            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">{t('plantDetail.recommended')}</p>
                    <p className="text-lg text-blue-700 font-bold">{getRecommendedInterval()} {t('plantDetail.days')}</p>
                  </div>
                  <button
                    onClick={setRecommendedInterval}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-cyan-600 font-semibold text-sm shadow-md transition-all"
                  >
                    {t('plantDetail.useThis')}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-4 mb-6 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('plantDetail.quickOptions')}</h4>
              <div className="flex flex-wrap gap-2">
                {[3, 5, 7, 10, 14, 21].map(days => (
                  <button
                    key={days}
                    onClick={() => setNewWateringInterval(days)}
                    className={`px-4 py-2 text-sm rounded-xl font-semibold transition-all ${
                      newWateringInterval === days
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-300'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200">
              <p className="text-sm text-emerald-900">
                <strong>{t('plantDetail.nextWateringLabel')}</strong>
              </p>
              <p className="text-lg font-bold text-emerald-700 mt-1">
                {new Date(Date.now() + newWateringInterval * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditSchedule(false)}
                disabled={updatingSchedule}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 border-2 border-gray-200"
              >
                {t('plantDetail.cancel')}
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={updatingSchedule || newWateringInterval < 1}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 shadow-lg"
              >
                {updatingSchedule ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('plantDetail.saving')}
                  </span>
                ) : (
                  t('plantDetail.saveSchedule')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
