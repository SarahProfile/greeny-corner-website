'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone)) {
        throw new Error(t('forgotPassword.validEmailRequired'));
      }

      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');

      await sendPasswordResetEmail(auth, emailOrPhone);

      setMessage(t('forgotPassword.successMessage'));
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError(t('forgotPassword.userNotFound'));
      } else if (err.code === 'auth/invalid-email') {
        setError(t('forgotPassword.invalidEmail'));
      } else {
        setError(err.message || t('forgotPassword.validEmailRequired'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('forgotPassword.title')}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('forgotPassword.description')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}
          <div>
            <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700">
              {t('forgotPassword.emailAddress')}
            </label>
            <input
              id="emailOrPhone"
              name="emailOrPhone"
              type="email"
              autoComplete="username"
              required
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              placeholder={t('forgotPassword.emailPlaceholder')}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('forgotPassword.sending') : t('forgotPassword.sendReset')}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
              {t('forgotPassword.backToSignIn')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
