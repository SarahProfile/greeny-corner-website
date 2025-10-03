'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plant, plantsAPI } from '@/lib/api';
import { notificationService } from '@/lib/notifications';
import Header from '@/components/Header';
import { useTranslation } from 'react-i18next';

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

  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setPlantId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (plantId) {
      fetchPlant();
    }
  }, [user, router, plantId]);

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
    } catch (err: any) {
      setError(t('plantDetail.failedToFetch'));
    } finally {
      setLoading(false);
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


  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'sick':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'needs_care':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'dying':
        return 'text-red-800 bg-red-100 border-red-300';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('plantDetail.loadingPlantDetails')}</div>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="min-h-screen bg-green-50">
        <Header />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error || t('plantDetail.plantNotFound')}
            </div>
            <div className="mt-4">
              <Link
                href="/my-plants"
                className="text-green-600 hover:text-green-500 font-medium"
              >
                {t('plantDetail.backToMyPlants')}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/my-plants"
              className="text-green-600 hover:text-green-500 font-medium"
            >
              {t('plantDetail.backToMyPlants')}
            </Link>
          </div>

          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="aspect-w-1 aspect-h-1 relative">
                <img
                  className="w-full h-96 object-cover"
                  src={plant.image_url}
                  alt={plant.name}
                />
              </div>
              
              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {plant.name}
                </h1>
                
                {(plant.scientific_name || plant.api_data?.scientific_name) && (
                  <p className="text-lg italic text-gray-600 mb-2">
                    {plant.scientific_name || plant.api_data.scientific_name}
                  </p>
                )}
                
                
                {plant.api_data?.description && (
                  <p className="text-gray-700 mb-6 leading-relaxed">{plant.api_data.description}</p>
                )}
                
                {/* Health Status */}
                {plant.health_status && (
                  <div className="mb-6">
                    <div className={`border rounded-lg p-4 ${getHealthStatusColor(plant.health_status)}`}>
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">{getHealthStatusIcon(plant.health_status)}</span>
                        <div>
                          <h3 className="text-lg font-medium capitalize">
                            {t('plantDetail.plantHealth')}: {t(`plantDetail.${plant.health_status.replace('_', '')}`)}
                          </h3>
                          {plant.last_health_check && (
                            <p className="text-sm opacity-75">
                              {t('plantDetail.lastChecked')} {formatDateTime(plant.last_health_check)}
                            </p>
                          )}
                        </div>
                      </div>
                      {plant.health_notes && (
                        <div className="mt-3">
                          <h4 className="font-medium mb-1">{t('plantDetail.healthNotes')}</h4>
                          <p className="text-sm leading-relaxed">{plant.health_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="space-y-8">
                  {/* Plant Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('plantDetail.plantInformation')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <dt className="text-sm font-medium text-gray-500 mb-1">{t('plantDetail.addedOn')}</dt>
                        <dd className="text-sm text-gray-900">{formatDate(plant.added_at)}</dd>
                      </div>
                      
                      {plant.api_data?.family && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <dt className="text-sm font-medium text-gray-500 mb-1">{t('plantDetail.family')}</dt>
                          <dd className="text-sm text-gray-900">{plant.api_data.family}</dd>
                        </div>
                      )}
                      
                      {plant.api_data?.origin && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <dt className="text-sm font-medium text-gray-500 mb-1">{t('plantDetail.origin')}</dt>
                          <dd className="text-sm text-gray-900">{plant.api_data.origin}</dd>
                        </div>
                      )}
                      
                      {plant.api_data?.growth_info && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <dt className="text-sm font-medium text-gray-500 mb-1">{t('plantDetail.matureSize')}</dt>
                          <dd className="text-sm text-gray-900">{plant.api_data.growth_info.size}</dd>
                        </div>
                      )}
                    </div>
                    
                    {plant.api_data?.common_names && plant.api_data.common_names.length > 0 && (
                      <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                        <dt className="text-sm font-medium text-blue-900 mb-2">{t('plantDetail.alsoKnownAs')}</dt>
                        <dd className="text-sm text-blue-800">
                          {plant.api_data.common_names.join(', ')}
                        </dd>
                      </div>
                    )}
                  </div>

                  {/* Growth Information */}
                  {plant.api_data?.growth_info && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">{t('plantDetail.growthInformation')}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <div className="text-xs font-medium text-green-900 mb-1">{t('plantDetail.growthRate')}</div>
                          <div className="text-xs text-green-700">{plant.api_data.growth_info.growth_rate}</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg text-center">
                          <div className="text-xs font-medium text-purple-900 mb-1">{t('plantDetail.height')}</div>
                          <div className="text-xs text-purple-700">{plant.api_data.growth_info.mature_height}</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg text-center">
                          <div className="text-xs font-medium text-orange-900 mb-1">{t('plantDetail.spread')}</div>
                          <div className="text-xs text-orange-700">{plant.api_data.growth_info.spread}</div>
                        </div>
                      </div>
                      <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-900 mb-1">{t('plantDetail.growthHabit')}</div>
                        <div className="text-sm text-gray-700">{plant.api_data.growth_info.growth_habit}</div>
                      </div>
                    </div>
                  )}

                  {/* Safety Information */}
                  {plant.api_data?.toxicity && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">{t('plantDetail.safetyInformation')}</h3>
                      <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-amber-700">{plant.api_data.toxicity}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Benefits */}
                  {plant.api_data?.benefits && plant.api_data.benefits.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">{t('plantDetail.plantBenefits')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {plant.api_data.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center bg-green-50 p-3 rounded-lg">
                            <svg className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-green-800">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interesting Facts */}
                  {plant.api_data?.interesting_facts && plant.api_data.interesting_facts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">{t('plantDetail.didYouKnow')}</h3>
                      <div className="space-y-3">
                        {plant.api_data.interesting_facts.map((fact, index) => (
                          <div key={index} className="flex items-start bg-indigo-50 p-4 rounded-lg">
                            <svg className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-indigo-800">{fact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Care Requirements */}
                  {plant.api_data?.care_info && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">{t('plantDetail.careRequirements')}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center mb-1">
                            <svg className="h-4 w-4 text-blue-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs font-medium text-blue-900">{t('plantDetail.watering')}</span>
                          </div>
                          <p className="text-xs text-blue-700">
                            Every {plant.api_data.care_info.watering_interval_days} days
                          </p>
                        </div>
                        
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <div className="flex items-center mb-1">
                            <svg className="h-4 w-4 text-yellow-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                            </svg>
                            <span className="text-xs font-medium text-yellow-900">{t('plantDetail.light')}</span>
                          </div>
                          <p className="text-xs text-yellow-700">{plant.api_data.care_info.light}</p>
                        </div>
                        
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center mb-1">
                            <svg className="h-4 w-4 text-green-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.4 4.4 0 003 15z" />
                            </svg>
                            <span className="text-xs font-medium text-green-900">{t('plantDetail.humidity')}</span>
                          </div>
                          <p className="text-xs text-green-700">{plant.api_data.care_info.humidity}</p>
                        </div>
                        
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="flex items-center mb-1">
                            <svg className="h-4 w-4 text-red-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="text-xs font-medium text-red-900">{t('plantDetail.temperature')}</span>
                          </div>
                          <p className="text-xs text-red-700">{plant.api_data.care_info.temperature}</p>
                        </div>
                      </div>
                      
                      {plant.api_data.care_info.care_tips && (
                        <div className="mt-3 bg-indigo-50 p-3 rounded-lg">
                          <h4 className="text-sm font-medium text-indigo-900 mb-1">{t('plantDetail.careTips')}</h4>
                          <p className="text-sm text-indigo-700">{plant.api_data.care_info.care_tips}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Next Watering */}
                  {plant.care_schedule && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">{t('plantDetail.nextWatering')}</h3>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-700">
                              {formatDateTime(plant.care_schedule.next_watering_date)}
                            </p>
                            <p className="text-xs text-green-600">
                              Every {plant.care_schedule.watering_interval_days} days
                            </p>
                          </div>
                          <div className="text-green-500">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <button 
                        onClick={handleWaterNow}
                        disabled={watering}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                      >
                        {watering ? t('plantDetail.wateringInProgress') : t('plantDetail.waterNow')}
                      </button>
                      <button 
                        onClick={handleEditSchedule}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                      >
                        {t('plantDetail.editSchedule')}
                      </button>
                    </div>
                    <div className="mt-3">
                      <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                      >
                        {t('plantDetail.deletePlant')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('plantDetail.deleteConfirmTitle')}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {t('plantDetail.deleteConfirmMessage', { plantName: plant?.name })}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded disabled:opacity-50"
              >
                {t('plantDetail.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
              >
                {deleting ? t('plantDetail.deleting') : t('plantDetail.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Schedule Modal */}
      {showEditSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 w-full">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">📅</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{t('plantDetail.editWateringSchedule')}</h3>
                <p className="text-sm text-gray-600">for {plant?.name}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('plantDetail.wateringIntervalDays')}
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={newWateringInterval}
                onChange={(e) => setNewWateringInterval(parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('plantDetail.current')} {plant?.care_schedule?.watering_interval_days} {t('plantDetail.days')}
              </p>
            </div>
            
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">{t('plantDetail.recommended')}</p>
                    <p className="text-sm text-blue-700">{getRecommendedInterval()} {t('plantDetail.days')}</p>
                  </div>
                  <button
                    onClick={setRecommendedInterval}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    {t('plantDetail.useThis')}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">{t('plantDetail.quickOptions')}</h4>
              <div className="flex flex-wrap gap-2">
                {[3, 5, 7, 10, 14, 21].map(days => (
                  <button
                    key={days}
                    onClick={() => setNewWateringInterval(days)}
                    className={`px-3 py-1 text-xs rounded ${
                      newWateringInterval === days 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4 text-sm text-gray-600">
              <p className="mb-1"><strong>{t('plantDetail.nextWateringLabel')}</strong> {new Date(Date.now() + newWateringInterval * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEditSchedule(false)}
                disabled={updatingSchedule}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded disabled:opacity-50"
              >
                {t('plantDetail.cancel')}
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={updatingSchedule || newWateringInterval < 1}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
              >
                {updatingSchedule ? t('plantDetail.saving') : t('plantDetail.saveSchedule')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}