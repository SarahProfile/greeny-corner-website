'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { notificationService } from '@/lib/notifications';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    emoji?: string;
    titleKey?: string;
    messageKey?: string;
    data?: any;
    title?: string;
    message?: string;
    timestamp: Date;
    read: boolean;
  }>>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load notification history from localStorage
    const loadNotifications = () => {
      const storedNotifications = localStorage.getItem('notification_history');
      if (storedNotifications) {
        try {
          const parsed = JSON.parse(storedNotifications);

          // Migrate old notifications to new format
          const migrated = parsed.map((n: any) => {
            // If it's already in new format with correct keys, return as-is
            if (n.titleKey && n.messageKey && n.titleKey.startsWith('plants.')) {
              return {
                ...n,
                timestamp: new Date(n.timestamp)
              };
            }

            // If it has old notification.* keys, need to re-migrate
            if (n.titleKey && n.titleKey.startsWith('notifications.')) {
              const newTitleKey = n.titleKey.replace('notifications.', 'plants.');
              const newMessageKey = n.messageKey.replace('notifications.', 'plants.');

              // For overdue notifications, ensure we have all required data
              if (newTitleKey === 'plants.overdueTitle') {
                // Check if data has all required fields
                const hasAllData = n.data && n.data.action && n.data.days && n.data.careType;

                if (!hasAllData) {
                  // Try to extract missing data from stored title/message if available
                  const titleMatch = n.title?.match(/🚨 (.+) needs (.+)!/);
                  const messageMatch = n.message?.match(/Your (.+) is (\d+) day\(s\) overdue for (.+)\./);

                  let action = n.data?.action || 'water';
                  let days = n.data?.days || '0';
                  let careType = n.data?.careType || 'watering';

                  if (titleMatch && titleMatch[2]) {
                    action = titleMatch[2];
                  }

                  if (messageMatch) {
                    days = messageMatch[2];
                    careType = messageMatch[3];
                  }

                  return {
                    ...n,
                    titleKey: newTitleKey,
                    messageKey: newMessageKey,
                    data: { ...n.data, plantName: n.data?.plantName, action, days, careType },
                    timestamp: new Date(n.timestamp)
                  };
                }
              }

              return {
                ...n,
                titleKey: newTitleKey,
                messageKey: newMessageKey,
                timestamp: new Date(n.timestamp)
              };
            }

            // Migrate old format to new format
            // Extract plant name from old English messages
            let plantName = 'Plant';
            let titleKey = '';
            let messageKey = '';
            let emoji = '🌿';

            // Parse watering notifications
            if (n.title?.includes('Time to water') || n.title?.includes('💧')) {
              emoji = '💧';
              titleKey = 'plants.wateringTitle';
              messageKey = 'plants.wateringMessage';
              const match = n.title?.match(/Time to water (.+)!/);
              if (match) plantName = match[1];
            }
            // Parse fertilizing notifications
            else if (n.title?.includes('Time to fertilize') || n.title?.includes('🌱')) {
              emoji = '🌱';
              titleKey = 'plants.fertilizingTitle';
              messageKey = 'plants.fertilizingMessage';
              const match = n.title?.match(/Time to fertilize (.+)!/);
              if (match) plantName = match[1];
            }
            // Parse tilling notifications
            else if (n.title?.includes('Time to till') || n.title?.includes('🪴')) {
              emoji = '🪴';
              titleKey = 'plants.tillingTitle';
              messageKey = 'plants.tillingMessage';
              const match = n.title?.match(/Time to till (.+)!/);
              if (match) plantName = match[1];
            }
            // Parse overdue notifications
            else if (n.title?.includes('needs')) {
              emoji = '🚨';
              titleKey = 'plants.overdueTitle';
              messageKey = 'plants.overdueMessage';
              // Extract plant name, action, days, and careType
              const titleMatch = n.title?.match(/🚨 (.+) needs (.+)!/);
              const messageMatch = n.message?.match(/Your (.+) is (\d+) day\(s\) overdue for (.+)\./);

              if (titleMatch) {
                plantName = titleMatch[1];
              }

              let action = 'care';
              let days = '0';
              let careType = 'care';

              if (titleMatch && titleMatch[2]) {
                action = titleMatch[2]; // e.g., "water", "fertilize"
              }

              if (messageMatch) {
                plantName = messageMatch[1];
                days = messageMatch[2];
                careType = messageMatch[3]; // e.g., "watering", "fertilizing"
              }

              return {
                ...n,
                emoji,
                titleKey,
                messageKey,
                data: { plantName, action, days, careType },
                timestamp: new Date(n.timestamp)
              };
            }

            return {
              ...n,
              emoji,
              titleKey,
              messageKey,
              data: { plantName },
              timestamp: new Date(n.timestamp)
            };
          });

          setNotifications(migrated);

          // Save migrated notifications back to localStorage
          localStorage.setItem('notification_history', JSON.stringify(migrated.map((n: any) => ({
            ...n,
            timestamp: n.timestamp.toISOString()
          }))));
        } catch (e) {
          console.error('Failed to parse notifications:', e);
        }
      }
    };

    loadNotifications();

    // Reload notifications periodically to catch new ones
    const interval = setInterval(loadNotifications, 5000); // Check every 5 seconds

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('notification_history', JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('notification_history');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  const isActive = (path: string) => {
    if (path === '/my-plants') {
      return pathname === '/my-plants' || pathname === '/my-plants/';
    }
    return pathname === path;
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <>
      {/* Notification Dropdown - Mobile Only */}
      {showNotifications && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowNotifications(false)}>
          <div
            ref={dropdownRef}
            className="absolute bottom-20 left-0 right-0 mx-4 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[70vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{t('nav.notifications')}</h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {t('notifications.clearAll')}
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-sm">{t('notifications.noNotifications')}</p>
                  <p className="text-xs mt-2 text-gray-400">{t('notifications.checkBackLater')}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-normal'} text-gray-900`}>
                          {notification.emoji}{' '}
                          {notification.titleKey && notification.data
                            ? (() => {
                                // For overdue notifications, ensure all required data is present and translate action/careType
                                if (notification.titleKey === 'plants.overdueTitle') {
                                  const rawAction = notification.data.action || 'care';
                                  const rawCareType = notification.data.careType || 'watering';

                                  // Map action to translation key
                                  const actionKeyMap: Record<string, string> = {
                                    'water': 'plants.actionWater',
                                    'fertilize': 'plants.actionFertilize',
                                    'till': 'plants.actionTill',
                                    'care': 'plants.actionCare'
                                  };

                                  // Map careType to translation key
                                  const careTypeKeyMap: Record<string, string> = {
                                    'watering': 'plants.careTypeWatering',
                                    'fertilizing': 'plants.careTypeFertilizing',
                                    'tilling': 'plants.careTypeTilling'
                                  };

                                  // Calculate actual days if we have a timestamp
                                  let daysOverdue = notification.data.days || '0';
                                  if (notification.timestamp) {
                                    const notifDate = new Date(notification.timestamp);
                                    const now = new Date();
                                    const daysSinceNotif = Math.floor((now.getTime() - notifDate.getTime()) / (24 * 60 * 60 * 1000));
                                    // If notification says 0 days but it's been more than a day since the notification, recalculate
                                    if (daysOverdue === '0' && daysSinceNotif > 0) {
                                      daysOverdue = String(daysSinceNotif);
                                    } else if (daysOverdue !== '0') {
                                      // Add days that have passed since notification was created
                                      daysOverdue = String(parseInt(daysOverdue) + daysSinceNotif);
                                    }
                                  }

                                  const completeData = {
                                    plantName: notification.data.plantName || 'Plant',
                                    action: String(t(actionKeyMap[rawAction] || 'plants.actionCare')),
                                    days: daysOverdue,
                                    careType: String(t(careTypeKeyMap[rawCareType] || 'plants.careTypeWatering'))
                                  };
                                  return String(t(notification.titleKey, completeData));
                                }
                                return String(t(notification.titleKey, notification.data));
                              })()
                            : notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.messageKey && notification.data
                            ? (() => {
                                // For overdue notifications, ensure all required data is present and translate action/careType
                                if (notification.messageKey === 'plants.overdueMessage') {
                                  const rawAction = notification.data.action || 'care';
                                  const rawCareType = notification.data.careType || 'watering';

                                  // Map action to translation key
                                  const actionKeyMap: Record<string, string> = {
                                    'water': 'plants.actionWater',
                                    'fertilize': 'plants.actionFertilize',
                                    'till': 'plants.actionTill',
                                    'care': 'plants.actionCare'
                                  };

                                  // Map careType to translation key
                                  const careTypeKeyMap: Record<string, string> = {
                                    'watering': 'plants.careTypeWatering',
                                    'fertilizing': 'plants.careTypeFertilizing',
                                    'tilling': 'plants.careTypeTilling'
                                  };

                                  // Calculate actual days if we have a timestamp
                                  let daysOverdue = notification.data.days || '0';
                                  if (notification.timestamp) {
                                    const notifDate = new Date(notification.timestamp);
                                    const now = new Date();
                                    const daysSinceNotif = Math.floor((now.getTime() - notifDate.getTime()) / (24 * 60 * 60 * 1000));
                                    // If notification says 0 days but it's been more than a day since the notification, recalculate
                                    if (daysOverdue === '0' && daysSinceNotif > 0) {
                                      daysOverdue = String(daysSinceNotif);
                                    } else if (daysOverdue !== '0') {
                                      // Add days that have passed since notification was created
                                      daysOverdue = String(parseInt(daysOverdue) + daysSinceNotif);
                                    }
                                  }

                                  const completeData = {
                                    plantName: notification.data.plantName || 'Plant',
                                    action: String(t(actionKeyMap[rawAction] || 'plants.actionCare')),
                                    days: daysOverdue,
                                    careType: String(t(careTypeKeyMap[rawCareType] || 'plants.careTypeWatering'))
                                  };
                                  return String(t(notification.messageKey, completeData));
                                }
                                return String(t(notification.messageKey, notification.data));
                              })()
                            : notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom navigation - only visible on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-5 h-16">
          {/* Home */}
          <button
            onClick={() => handleNavigation('/my-plants')}
            className={`flex flex-col items-center justify-center ${
              isActive('/my-plants') ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">{t('nav.home')}</span>
          </button>

          {/* My Plants */}
          <button
            onClick={() => handleNavigation('/my-plants')}
            className={`flex flex-col items-center justify-center ${
              pathname?.startsWith('/my-plants') ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1">{t('nav.myPlants')}</span>
          </button>

          {/* Add Plant */}
          <button
            onClick={() => handleNavigation('/add-plant')}
            className="flex flex-col items-center justify-center text-green-600"
          >
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center -mt-6 shadow-lg border-4 border-white">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </button>

          {/* Notifications */}
          <button
            onClick={handleNotificationClick}
            className="flex flex-col items-center justify-center text-gray-600 relative"
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{t('nav.notifications')}</span>
          </button>

          {/* Account */}
          <button
            onClick={() => handleNavigation('/account')}
            className={`flex flex-col items-center justify-center ${
              isActive('/account') ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">{t('nav.account')}</span>
          </button>
        </div>
      </nav>

      {/* Spacer for fixed bottom nav - only on mobile */}
      <div className="md:hidden h-16"></div>
    </>
  );
}
