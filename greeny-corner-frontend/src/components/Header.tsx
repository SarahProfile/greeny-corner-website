'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { notificationService } from '@/lib/notifications';

interface HeaderProps {
  showUserInfo?: boolean;
}

export default function Header({ showUserInfo = true }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
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
  const notificationRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

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
    const interval = setInterval(loadNotifications, 5000);

    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowAccountMenu(false);
  };

  const handleAccountMenuClick = () => {
    setShowAccountMenu(!showAccountMenu);
    setShowNotifications(false);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('notification_history', JSON.stringify(updated));
  };

  const handleNotificationItemClick = (notification: any) => {
    // Mark as read
    markAsRead(notification.id);

    // Only navigate if we have a plant ID
    if (notification.data?.plantId) {
      setShowNotifications(false);
      router.push(`/my-plants/${notification.data.plantId}`);
    } else {
      // For old notifications without plantId, just mark as read but don't navigate
      // User should clear old notifications to get clickable ones
      console.log('Notification missing plantId. Please clear old notifications.');
    }
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('notification_history');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={user ? "/my-plants" : "/"}>
              <img
                src="/greeny-logo.svg"
                alt={t('common.appLogoAlt')}
                className="h-16 cursor-pointer"
                style={{width: 'auto'}}
              />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {showUserInfo && user && (
              <>
                {/* Desktop Navigation Links */}
                <nav className="hidden md:flex items-center space-x-1">
                  <Link
                    href="/my-plants"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    {t('nav.myPlants')}
                  </Link>
                  <Link
                    href="/add-plant"
                    className="px-3 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{t('navigation.addPlant')}</span>
                  </Link>
                  <Link
                    href="/account"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    {t('nav.account')}
                  </Link>
                </nav>

                {/* Notification Bell - Desktop Only */}
                <div className="hidden md:block relative" ref={notificationRef}>
                  <button
                    onClick={handleNotificationClick}
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown - Facebook Style */}
                  {showNotifications && (
                    <div className={`fixed ${isRTL ? 'left-4' : 'right-4'} top-16 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col`}>
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">{t('nav.notifications')}</h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={clearAll}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {t('notifications.clearAll')}
                          </button>
                        )}
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
                              onClick={() => handleNotificationItemClick(notification)}
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

                                            // Calculate actual days - prefer dueDate if available, otherwise use timestamp-based calculation
                                            let daysOverdue = notification.data.days || '0';

                                            if (notification.data.dueDate) {
                                              // If we have the original due date, calculate actual overdue days
                                              const dueDate = new Date(notification.data.dueDate);
                                              const now = new Date();
                                              const actualDaysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
                                              daysOverdue = String(Math.max(0, actualDaysOverdue)); // Don't show negative
                                            } else if (notification.timestamp) {
                                              // Fallback: estimate based on notification timestamp
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

                                            // Calculate actual days - prefer dueDate if available, otherwise use timestamp-based calculation
                                            let daysOverdue = notification.data.days || '0';

                                            if (notification.data.dueDate) {
                                              // If we have the original due date, calculate actual overdue days
                                              const dueDate = new Date(notification.data.dueDate);
                                              const now = new Date();
                                              const actualDaysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
                                              daysOverdue = String(Math.max(0, actualDaysOverdue)); // Don't show negative
                                            } else if (notification.timestamp) {
                                              // Fallback: estimate based on notification timestamp
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

                                            // If days seem wrong (0 but no dueDate), use message without days
                                            const useNoDaysMessage = daysOverdue === '0' && !notification.data.dueDate;
                                            const messageKey = useNoDaysMessage ? 'plants.overdueMessageNoDays' : notification.messageKey;

                                            const completeData = {
                                              plantName: notification.data.plantName || 'Plant',
                                              action: String(t(actionKeyMap[rawAction] || 'plants.actionCare')),
                                              days: daysOverdue,
                                              careType: String(t(careTypeKeyMap[rawCareType] || 'plants.careTypeWatering'))
                                            };
                                            return String(t(messageKey, completeData));
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
                  )}
                </div>

                {/* Account Menu - Desktop Only */}
                <div className="hidden md:block relative" ref={accountMenuRef}>
                  <button
                    onClick={handleAccountMenuClick}
                    className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-green-700">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Account Dropdown Menu */}
                  {showAccountMenu && (
                    <div className={`fixed ${isRTL ? 'left-4' : 'right-4'} top-16 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1`}>
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                      </div>
                      <Link
                        href="/my-plants"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {t('nav.myPlants')}
                        </div>
                      </Link>
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {t('nav.account')}
                        </div>
                      </Link>
                      <div className="border-t border-gray-200 mt-1">
                        <button
                          onClick={() => {
                            setShowAccountMenu(false);
                            handleLogout();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {t('auth.signOut')}
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
