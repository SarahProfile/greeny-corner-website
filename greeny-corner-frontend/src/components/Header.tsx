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
  const { t } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
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
          setNotifications(parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          })));
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

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleNotificationClick = () => {
    // Simply toggle the dropdown - no permission needed
    console.log('Notification bell clicked. Current state:', showNotifications);
    console.log('Current notifications:', notifications);
    setShowNotifications(!showNotifications);
  };

  const handleTestNotification = () => {
    // Directly add a test notification to localStorage
    try {
      const existingNotifications = localStorage.getItem('notification_history');
      const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];

      const newNotification = {
        id: `test-${Date.now()}`,
        title: '🌿 Test Notification',
        message: 'This is a test notification to verify the notification bell is working correctly.',
        timestamp: new Date().toISOString(),
        read: false
      };

      notifications.unshift(newNotification);
      localStorage.setItem('notification_history', JSON.stringify(notifications));

      // Reload notifications
      setNotifications(notifications.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      })));

      console.log('Test notification added:', newNotification);
      console.log('Total notifications:', notifications.length);
      alert(`Test notification added! Total: ${notifications.length}. Click the bell icon to see it.`);
    } catch (e) {
      console.error('Failed to add test notification:', e);
      alert('Error adding notification: ' + e);
    }
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
                {/* Test Notification Button - Remove after testing */}
                <button
                  onClick={handleTestNotification}
                  className="hidden md:block px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  title="Send test notification"
                >
                  Test
                </button>

                {/* Notification Bell - Desktop Only */}
                <div className="hidden md:block relative" ref={dropdownRef}>
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

                  {/* Notification Dropdown Panel */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
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
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
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

                <span className="hidden md:block text-gray-700">{t('header.welcomeUser', { name: user.name })}</span>
                <button
                  onClick={handleLogout}
                  className="hidden md:block text-gray-500 hover:text-gray-700 font-medium"
                >
                  {t('auth.signOut')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}