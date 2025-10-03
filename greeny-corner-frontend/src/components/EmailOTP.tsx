'use client';

import { useState } from 'react';

interface EmailOTPProps {
  onSuccess: (user: any, isRegistering: boolean) => void;
  onError: (error: string) => void;
  mode: 'login' | 'register';
  userName?: string;
}

export default function EmailOTP({ onSuccess, onError, mode, userName }: EmailOTPProps) {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sendVerificationCode = async () => {
    if (!isValidEmail(email)) {
      onError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📧 Sending email OTP to:', email);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          mode: mode,
          name: userName || 'User'
        }),
      });
      
      console.log('📧 Email OTP response status:', response.status);
      const responseText = await response.text();
      console.log('📧 Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError);
        throw new Error(`Server returned invalid response: ${responseText}`);
      }

      if (!response.ok) {
        console.error('❌ Email OTP failed with data:', data);
        throw new Error(data.message || data.error || 'Failed to send verification code');
      }

      console.log('✅ Email OTP sent successfully:', data);
      setStep('verify');
      
    } catch (error: any) {
      console.error('❌ Email OTP error:', error);
      onError(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    console.log('🔐 Email verification process started');
    console.log('📝 Entered code:', verificationCode);
    console.log('📝 Code length:', verificationCode?.length);
    
    if (!verificationCode || verificationCode.length < 6) {
      console.log('❌ Invalid code length');
      onError('Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📧 Verifying email OTP...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: verificationCode,
          mode: mode,
          name: userName || 'User'
        }),
      });
      
      console.log('📧 Verification response status:', response.status);
      const responseText = await response.text();
      console.log('📧 Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError);
        throw new Error(`Server returned invalid response: ${responseText}`);
      }

      if (!response.ok) {
        console.error('❌ Email verification failed with data:', data);
        throw new Error(data.message || data.error || 'Verification failed');
      }

      console.log('✅ Email verification successful:', data);
      console.log('📧 Full API response structure:', JSON.stringify(data, null, 2));
      console.log('📧 Calling onSuccess with full response data');
      
      onSuccess(data, mode === 'register');

    } catch (error: any) {
      console.error('❌ Code verification error:', error);
      onError(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('email');
    setVerificationCode('');
  };

  return (
    <div className="space-y-6">
      {step === 'email' && (
        <>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
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
            <p className="mt-1 text-xs text-gray-500">
              We'll send a 6-digit verification code to this email
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={sendVerificationCode}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        </>
      )}

      {step === 'verify' && (
        <>
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
            <p className="mt-1 text-xs text-gray-500">
              Enter the verification code sent to {email}
            </p>
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
              type="button"
              onClick={verifyCode}
              disabled={loading}
              className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}