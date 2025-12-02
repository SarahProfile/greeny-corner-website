'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/notifications';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Check if notifications are enabled
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const permission = await notificationService.requestPermission();
      if (permission) {
        setNotificationsEnabled(true);
      }
    } else {
      // Can't programmatically disable - show message
      alert(t('notifications.disableInstructions') || 'To disable notifications, please go to your browser settings');
    }
  };

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
      {/* Fixed bottom navigation - only visible on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-4 h-16">
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

          {/* Notifications */}
          <button
            onClick={handleNotificationToggle}
            className={`flex flex-col items-center justify-center ${
              notificationsEnabled ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificationsEnabled && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
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
