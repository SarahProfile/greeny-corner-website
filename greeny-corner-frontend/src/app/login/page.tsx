'use client';

import { useState } from 'react';
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

  const { login, setAuthenticatedUser } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

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
      const result = await signInWithPopup(auth, provider);
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
        setError(t('auth.popupBlocked'));
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
        setError('No account found with this email address.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Try again later.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        
        <div>
          <div className="flex justify-center mb-6">
            <img 
              src="/greeny-logo.svg" 
              alt={t('app.title')} 
              className="h-24"
              style={{width: 'auto'}}
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.signIn')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.dontHaveAccount')}{' '}
            <Link href="/register" className="font-medium text-green-600 hover:text-green-500">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>

        {/* Authentication Method Selection */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleAuthMethodChange('social')}
            className={`py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              authMethod === 'social'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🔍 {t('auth.google')}
          </button>
          <button
            type="button"
            onClick={() => handleAuthMethodChange('email')}
            className={`py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              authMethod === 'email'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📧 {t('auth.emailPassword')}
          </button>
        </div>

        {error && (
          <div className={`border px-4 py-3 rounded ${
            error.includes('Development mode') || error.includes('Use verification code')
              ? 'bg-blue-100 border-blue-400 text-blue-700'
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
            {error}
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
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? t('auth.signingIn') : t('auth.continueWithGoogle')}
            </button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleEmailSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder={t('auth.enterEmail')}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder={t('auth.enterPassword')}
                />
              </div>
            </div>

            {authMethod === 'email' && (
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-green-600 hover:text-green-500">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('auth.signingIn') : t('auth.signInButton')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}