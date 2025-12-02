'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface HeaderProps {
  showUserInfo?: boolean;
}

export default function Header({ showUserInfo = true }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

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