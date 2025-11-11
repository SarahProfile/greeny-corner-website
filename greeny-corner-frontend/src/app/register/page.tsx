'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, setAuthenticatedUser } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const handleAuthMethodChange = (method: 'google' | 'email') => {
    setAuthMethod(method);
    setEmail('');
    setError('');
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');

      console.log('🔐 Attempting Google registration');

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      console.log('✅ Google registration successful:', firebaseUser);

      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();

      // Register with Laravel backend using Firebase token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebase_uid: firebaseUser.uid,
          firebase_token: idToken,
          provider: 'google',
          name: firebaseUser.displayName || name || 'Google User',
          email: firebaseUser.email,
          photo_url: firebaseUser.photoURL,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('auth.backendRegFailed'));
      }

      console.log('✅ Google backend registration successful:', data);

      // Extract auth data
      let authToken = data.access_token || data.token || (data.data && data.data.access_token);
      let userData = data.user || data.data || (data.user && data.user.user) || data;

      if (authToken && userData) {
        const cleanUserData = { ...userData };
        delete cleanUserData.access_token;
        delete cleanUserData.token;

        setAuthenticatedUser(cleanUserData, authToken);
        router.push('/my-plants');
      } else {
        setError(t('auth.authDataMissing'));
      }

    } catch (err: any) {
      console.error('❌ Google registration failed:', err);

      if (err.code === 'auth/popup-closed-by-user') {
        setError(t('auth.registrationCancelled'));
      } else if (err.code === 'auth/popup-blocked') {
        setError(t('auth.popupBlocked'));
      } else {
        setError(err.message || t('auth.googleRegistrationFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== passwordConfirmation) {
      setError(t('auth.passwordsMismatch'));
      setLoading(false);
      return;
    }

    try {
      await register(name, email, password, passwordConfirmation);
      router.push('/my-plants');
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
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

      <div className="max-w-md w-full mx-4 animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-8 animate-slideUp">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform">
              <img
                src="/greeny-logo.svg"
                alt={t('app.title')}
                className="h-20"
                style={{width: 'auto'}}
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            {t('app.title')}
          </h1>
          <p className="text-gray-600 font-medium">{t('common.tagline')}</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 animate-slideUp" style={{animationDelay: '0.1s'}}>
          {/* Language Switcher */}
          <div className="flex justify-end p-4 border-b border-gray-100">
            <LanguageSwitcher />
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              {t('auth.createAccount')}
            </h2>
            <p className="text-center text-sm text-gray-600 mb-6">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                {t('auth.signIn')}
              </Link>
            </p>

            {/* Authentication Method Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleAuthMethodChange('google')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all transform hover:-translate-y-1 ${
                  authMethod === 'google'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-md'
                }`}
              >
                🔍 {t('auth.google')}
              </button>
              <button
                type="button"
                onClick={() => handleAuthMethodChange('email')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all transform hover:-translate-y-1 ${
                  authMethod === 'email'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-md'
                }`}
              >
                📧 {t('auth.emailPassword')}
              </button>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {authMethod === 'google' ? (
              <div className="space-y-5">
                {/* Name field for Google */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.fullName')}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder={t('auth.fullNamePlaceholder')}
                  />
                </div>

                <div className="text-center text-sm text-gray-600">
                  {t('auth.createAccountWithGoogle')}
                </div>

                {/* Google Registration Button */}
                <button
                  type="button"
                  onClick={handleGoogleRegister}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg bg-white text-base font-semibold text-gray-700 hover:bg-gray-50 hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('auth.creatingAccount')}
                    </span>
                  ) : (
                    t('auth.continueWithGoogle')
                  )}
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleEmailSubmit}>
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.fullName')}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder={t('auth.fullNamePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.emailAddress')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder={t('auth.enterEmail')}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.password')}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder={t('auth.enterPassword')}
                  />
                </div>

                <div>
                  <label htmlFor="password_confirmation" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('auth.creatingAccount')}
                    </span>
                  ) : (
                    t('auth.signUpButton')
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600 animate-slideUp" style={{animationDelay: '0.2s'}}>
          {t('footer.tagline')}
        </p>
      </div>
    </div>
  );
}
