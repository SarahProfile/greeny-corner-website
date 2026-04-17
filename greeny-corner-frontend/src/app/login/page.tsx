'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'social' | 'email'>('social');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, setAuthenticatedUser, loginAsGuest } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();


  const IOS_APP_URL = 'https://apps.apple.com/app/id6740227597';

  const handleGuestAccess = () => {
    loginAsGuest();
    router.push('/my-plants');
  };

  const handleAuthMethodChange = (method: 'social' | 'email') => {
    setAuthMethod(method);
    setEmail('');
    setError('');
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');

      console.log('🔐 Attempting Google social login');

      const provider = new GoogleAuthProvider();

      // Add timeout for mobile
      const loginPromise = signInWithPopup(auth, provider);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout - please try again')), 60000)
      );

      const result = await Promise.race([loginPromise, timeoutPromise]) as any;
      const firebaseUser = result.user;

      console.log('✅ Google login successful:', firebaseUser);
      console.log('👤 Firebase user details:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      });

      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();

      // Authenticate with Laravel backend using Firebase token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebase_uid: firebaseUser.uid,
          firebase_token: idToken,
          provider: 'google',
          name: firebaseUser.displayName || 'Google User',
          email: firebaseUser.email,
          photo_url: firebaseUser.photoURL,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Backend authentication failed');
      }

      console.log('✅ Google backend authentication successful:', data);

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
      console.error('❌ Google login failed:', err);

      if (err.code === 'auth/popup-closed-by-user') {
        setError(t('auth.loginCancelled'));
      } else if (err.code === 'auth/popup-blocked') {
        setError(t('auth.popupBlocked') + ' - Please enable popups in your browser settings');
      } else if (err.code === 'auth/network-request-failed') {
        setError(t('auth.networkError'));
      } else if (err.message && err.message.includes('timeout')) {
        setError(t('auth.loginTimeout'));
      } else if (err.message && err.message.includes('Load failed')) {
        setError(t('auth.googleConnectionFailed'));
      } else {
        setError(err.message || t('auth.googleLoginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };


  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use Firebase for email/password authentication
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');

      console.log('🔐 Attempting Firebase email/password login');
      console.log('📧 Email:', email);
      console.log('🔑 Password length:', password?.length);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      console.log('✅ Firebase login successful:', firebaseUser);
      console.log('👤 Firebase user details:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        emailVerified: firebaseUser.emailVerified
      });

      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();

      // Authenticate with Laravel backend using Firebase token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebase_uid: firebaseUser.uid,
          firebase_token: idToken,
          provider: 'google', // Use 'google' for email/password Firebase auth
          name: firebaseUser.displayName || 'Email User',
          email: firebaseUser.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Backend authentication failed');
      }

      console.log('✅ Backend authentication successful:', data);
      console.log('🔍 Full backend response structure:', JSON.stringify(data, null, 2));

      // Try to extract data from various possible structures
      let authToken = data.access_token || data.token || (data.data && data.data.access_token);
      let userData = data.user || data.data || (data.user && data.user.user) || data;

      console.log('🔍 Email Auth - Token found:', authToken ? 'YES' : 'NO');
      console.log('🔍 Email Auth - User data found:', userData ? 'YES' : 'NO');
      console.log('🔍 Email Auth - Token value:', authToken);
      console.log('🔍 Email Auth - User data:', userData);

      // Store auth data using AuthContext and redirect
      if (authToken && userData) {
        console.log('💾 Email Auth - Using AuthContext to set user');

        // Remove sensitive token info from user data
        const cleanUserData = { ...userData };
        delete cleanUserData.access_token;
        delete cleanUserData.token;

        // Use AuthContext to set the authenticated user
        setAuthenticatedUser(cleanUserData, authToken);

        console.log('🔄 Email Auth - Redirecting to my-plants');
        router.push('/my-plants');
      } else {
        console.log('❌ Email Auth - Missing token or user data');
        console.log('❌ Email Auth - Available properties:', Object.keys(data));
        setError(`Authentication data missing. Available keys: ${Object.keys(data).join(', ')}`);
      }

    } catch (err: any) {
      console.error('❌ Email/password login failed:', err);

      if (err.code === 'auth/user-not-found') {
        setError(t('auth.noAccountFound'));
      } else if (err.code === 'auth/wrong-password') {
        setError(t('auth.incorrectPassword'));
      } else if (err.code === 'auth/invalid-email') {
        setError(t('auth.invalidEmail'));
      } else if (err.code === 'auth/too-many-requests') {
        setError(t('auth.tooManyAttempts'));
      } else {
        setError(err.message || t('auth.backendAuthFailed'));
      }
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
        {/* Logo and Language Switcher */}
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
              {t('auth.signIn')}
            </h2>
            <p className="text-center text-sm text-gray-600 mb-6">
              {t('auth.dontHaveAccount')}{' '}
              <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                {t('auth.signUp')}
              </Link>
            </p>

            {/* Authentication Method Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleAuthMethodChange('social')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all transform hover:-translate-y-1 ${
                  authMethod === 'social'
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
              <div className={`border-2 px-4 py-3 rounded-2xl mb-6 flex items-start ${
                error.includes('Development mode') || error.includes('Use verification code')
                  ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 text-blue-700'
                  : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300 text-red-700'
              }`}>
                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {authMethod === 'social' ? (
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-600 mb-6">
                  {t('auth.signInWithGoogle')}
                </div>

                {/* Google Login Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
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
                      {t('auth.signingIn')}
                    </span>
                  ) : (
                    t('auth.continueWithGoogle')
                  )}
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleEmailSubmit}>
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
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder={t('auth.enterPassword')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link href="/forgot-password" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>
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
                      {t('auth.signingIn')}
                    </span>
                  ) : (
                    t('auth.signInButton')
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Divider */}
          <div className="px-8 pb-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-400">or</span>
              </div>
            </div>
          </div>

          {/* Continue as Guest */}
          <div className="px-8 pb-6">
            <button
              type="button"
              onClick={handleGuestAccess}
              className="w-full flex justify-center py-3 px-6 border-2 border-gray-200 text-sm font-semibold rounded-xl text-gray-600 bg-white hover:bg-gray-50 transition-all"
            >
              {t('auth.browseAsGuest') || 'Browse as Guest'}
            </button>
          </div>

          {/* App Store Download */}
          <div className="px-8 pb-8 border-t border-gray-100 pt-6 text-center">
            <p className="text-xs text-gray-500 mb-3">{t('common.getFullExperience') || 'Get the full experience on your phone'}</p>
            <div className="flex justify-center">
              <a
                href={IOS_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-xs rounded-xl hover:bg-gray-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span>
                  <span className="block text-[10px] leading-tight opacity-75">Download on the</span>
                  <span className="block text-sm font-semibold leading-tight">App Store</span>
                </span>
              </a>
            </div>
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
