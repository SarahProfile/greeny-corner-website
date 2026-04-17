'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import PhoneAuth from '@/components/PhoneAuth';

const IOS_APP_URL = 'https://apps.apple.com/app/id6740227597';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, loginAsGuest } = useAuth();
  const router = useRouter();

  const handleGuestAccess = () => {
    loginAsGuest();
    router.push('/my-plants');
  };

  const handleAuthMethodChange = (method: 'email' | 'phone') => {
    setAuthMethod(method);
    setEmail('');
    setError('');
  };

  const handlePhoneAuthSuccess = (user: any, isRegistering: boolean) => {
    // Store auth token if provided
    if (user.access_token) {
      localStorage.setItem('auth_token', user.access_token);
      localStorage.setItem('user', JSON.stringify(user.user || user));
    }
    router.push('/my-plants');
  };

  const handlePhoneAuthError = (error: string) => {
    setError(error);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/my-plants');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Greeny Corner
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-green-600 hover:text-green-500">
              Sign up
            </Link>
          </p>
        </div>

        {/* Authentication Method Selection */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleAuthMethodChange('email')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authMethod === 'email'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📧 Email + Password
          </button>
          <button
            type="button"
            onClick={() => handleAuthMethodChange('phone')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              authMethod === 'phone'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📱 Phone + SMS
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {authMethod === 'phone' ? (
          <PhoneAuth
            mode="login"
            onSuccess={handlePhoneAuthSuccess}
            onError={handlePhoneAuthError}
          />
        ) : (
          <form className="space-y-6" onSubmit={handleEmailSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
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
                  placeholder="Enter your email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
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
                  placeholder="Password"
                />
              </div>
            </div>

            {authMethod === 'email' && (
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-green-600 hover:text-green-500">
                    Forgot your password?
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
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        {/* Continue as Guest */}
        <button
          type="button"
          onClick={handleGuestAccess}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          Browse as Guest
        </button>

        {/* App Store Download */}
        <div className="pt-2 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-3">Get the full experience on your phone</p>
          <div className="flex justify-center gap-3">
            <a
              href={IOS_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
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
    </div>
  );
}