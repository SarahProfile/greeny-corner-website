'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plant, plantsAPI } from '@/lib/api';
import { notificationService } from '@/lib/notifications';
import Header from '@/components/Header';
import { useTranslation } from 'react-i18next';

export default function MyPlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    console.log('🌱 MyPlants: useEffect triggered');
    console.log('🌱 MyPlants: user state:', user);
    console.log('🌱 MyPlants: auth loading state:', authLoading);
    
    // Wait for auth context to finish loading before making decisions
    if (authLoading) {
      console.log('⏳ MyPlants: Still loading auth state, waiting...');
      return;
    }
    
    if (!user) {
      console.log('❌ MyPlants: No user found after loading, redirecting to login');
      router.push('/login');
      return;
    }

    console.log('✅ MyPlants: User authenticated, loading plants');
    fetchPlants();
    checkNotificationPermission();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (plants.length > 0 && notificationsEnabled) {
      // Check for overdue plants and schedule notifications
      notificationService.checkOverduePlants(plants);
      notificationService.scheduleAllPlantNotifications(plants);
    }
  }, [plants, notificationsEnabled]);

  useEffect(() => {
    // Listen for language change events
    const handleLanguageChange = (event: CustomEvent) => {
      console.log('Language changed to:', event.detail.language);
      console.log('Refreshing plant data...');
      fetchPlants(); // Refresh plant data when language changes
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  const checkNotificationPermission = async () => {
    const enabled = notificationService.getNotificationsEnabled();
    setNotificationsEnabled(enabled);
    
    if (enabled && !notificationService.canSendNotifications()) {
      setShowNotificationPrompt(true);
    }
  };

  const enableNotifications = async () => {
    console.log('🔔 Enable notifications button clicked');
    try {
      const granted = await notificationService.requestPermission();
      console.log('🔔 Permission granted:', granted);

      if (granted) {
        notificationService.setNotificationsEnabled(true);
        setNotificationsEnabled(true);
        setShowNotificationPrompt(false);

        // Schedule notifications for existing plants
        if (plants.length > 0) {
          console.log('🔔 Scheduling notifications for', plants.length, 'plants');
          notificationService.checkOverduePlants(plants);
          notificationService.scheduleAllPlantNotifications(plants);
        }
      } else {
        console.warn('🔔 Permission was not granted');
      }
    } catch (error) {
      console.error('🔔 Error enabling notifications:', error);
      alert('Failed to enable notifications. Please check your browser settings and try again.');
    }
  };

  const disableNotifications = () => {
    notificationService.setNotificationsEnabled(false);
    setNotificationsEnabled(false);
    setShowNotificationPrompt(false);
  };

  const fetchPlants = async () => {
    try {
      const data = await plantsAPI.getPlants();
      setPlants(data);
    } catch (err: any) {
      setError('Failed to fetch plants');
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getNextWateringDate = (plant: Plant) => {
    if (plant.care_schedule) {
      return new Date(plant.care_schedule.next_watering_date).toLocaleDateString();
    }
    return 'Not set';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('plants.loadingPlants')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('plants.myPlants')}</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowNotificationPrompt(true)}
                className={`px-4 py-2 rounded font-medium ${
                  notificationsEnabled 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                🔔 {notificationsEnabled ? t('plants.enableNotifications') : t('plants.enableNotifications')}
              </button>
              <Link
                href="/add-plant"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                {t('plants.addPlant')}
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {plants.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('plants.noPlants')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('plants.getStartedText')}
              </p>
              <div className="mt-6">
                <Link
                  href="/add-plant"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  {t('plants.addPlant')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plants.map((plant) => (
                <div
                  key={plant.id}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
                >
                  <div className="aspect-w-3 aspect-h-2">
                    <img
                      className="w-full h-48 object-cover"
                      src={plant.image_url}
                      alt={plant.name}
                    />
                  </div>
                  <div className="px-4 py-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {plant.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('plants.added')}: {formatDate(plant.added_at)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('plants.nextWateringDate')}: {getNextWateringDate(plant)}
                    </p>
                    <div className="mt-4">
                      <Link
                        href={`/my-plants/${plant.id}`}
                        className="text-green-600 hover:text-green-500 font-medium"
                      >
                        {t('plants.viewDetails')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Notification Permission Modal */}
      {showNotificationPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🔔</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{t('plants.enableNotifications')}</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                {t('plants.notificationDescription')}
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">💧</span>
                  {t('plants.wateringReminders')}
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  {t('plants.overdueAlerts')}
                </li>
                <li className="flex items-center">
                  <span className="text-blue-600 mr-2">🕐</span>
                  {t('plants.advanceWarnings')}
                </li>
              </ul>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={disableNotifications}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
              >
                {t('plants.laterButton')}
              </button>
              <button
                onClick={enableNotifications}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
              >
                {t('plants.enableButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}