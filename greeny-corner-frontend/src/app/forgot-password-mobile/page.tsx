'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordMobilePage() {
  const [identifier, setIdentifier] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify' | 'reset'>('input');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isPhone = (value: string) => /^\+?[1-9]\d{1,14}$/.test(value);

  const handleMethodChange = (method: 'email' | 'phone') => {
    setAuthMethod(method);
    setIdentifier('');
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (authMethod === 'email') {
        await handleEmailReset();
      } else {
        await handlePhoneReset();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailReset = async () => {
    if (!isEmail(identifier)) {
      throw new Error('Please enter a valid email address.');
    }

    // Dynamic import Firebase to ensure it only runs on client side
    const { sendPasswordResetEmail } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase');

    // Use Firebase password reset
    await sendPasswordResetEmail(auth, identifier);
    
    setMessage('Password reset instructions have been sent to your email address.');
  };

  const handlePhoneReset = async () => {
    if (!isPhone(identifier)) {
      throw new Error('Please enter a valid phone number (e.g., +1234567890).');
    }

    // Use Laravel API for phone-based reset
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mobile/forgot-password/phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: identifier,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send verification code');
    }

    setStep('verify');
    if (data.reset_code) {
      // Development mode - show the code
      setMessage(`Verification code sent! For development, use this code: ${data.reset_code}`);
    } else {
      setMessage('Verification code sent to your phone. Enter it below.');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use Laravel API to verify the code
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mobile/forgot-password/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: identifier,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      // Store the reset token for the next step
      (window as any).resetToken = data.reset_token;
      
      setMessage('Code verified successfully! Now set your new password.');
      setStep('reset');
      
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const resetToken = (window as any).resetToken;
      
      if (!resetToken) {
        throw new Error('Reset session expired. Please try again.');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mobile/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resetToken}`,
        },
        body: JSON.stringify({
          phone: identifier,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      setMessage('Password reset successfully! You can now log in with your new password.');
      
      // Clean up
      delete (window as any).resetToken;
      
      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('input');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('');
    setError('');
    delete (window as any).resetToken;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose your preferred reset method
          </p>
        </div>

        {step === 'input' && (
          <>
            {/* Method Selection */}
            <div className="flex space-x-4">
              <button
                onClick={() => handleMethodChange('email')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  authMethod === 'email'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📧 Email
              </button>
              <button
                onClick={() => handleMethodChange('phone')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  authMethod === 'phone'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📱 Phone
              </button>
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
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                  {authMethod === 'email' ? 'Email address' : 'Phone number'}
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type={authMethod === 'email' ? 'email' : 'tel'}
                  autoComplete={authMethod === 'email' ? 'email' : 'tel'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder={authMethod === 'email' ? 'Enter your email address' : 'Enter your phone number (+1234567890)'}
                />
                {authMethod === 'phone' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Include country code (e.g., +1 for US, +44 for UK)
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 
                   authMethod === 'email' ? 'Send reset email' : 'Send verification code'}
                </button>
              </div>

            </form>
          </>
        )}

        {step === 'verify' && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
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
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
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
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Enter new password"
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Confirm new password"
                minLength={8}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Start Over
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}