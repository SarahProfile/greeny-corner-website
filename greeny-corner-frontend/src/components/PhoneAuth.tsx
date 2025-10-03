'use client';

import { useState, useEffect, useRef } from 'react';

interface PhoneAuthProps {
  onSuccess: (user: any, isRegistering: boolean) => void;
  onError: (error: string) => void;
  mode: 'login' | 'register';
  userName?: string;
}

export default function PhoneAuth({ onSuccess, onError, mode, userName }: PhoneAuthProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<any>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const isValidPhone = (phone: string) => {
    // More flexible phone validation that accepts common formats
    const phoneRegex = /^\+?[1-9]\d{7,14}$/;
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanedPhone);
  };

  useEffect(() => {
    return () => {
      // Cleanup reCAPTCHA when component unmounts
      cleanupRecaptcha();
    };
  }, []);

  const cleanupRecaptcha = async () => {
    // Use the global cleanup function from firebase.ts
    try {
      const { clearRecaptcha } = await import('@/lib/firebase');
      clearRecaptcha();
      recaptchaRef.current = null;
    } catch (e) {
      console.log('Global reCAPTCHA cleanup error:', e);
    }
    
    // Clear the container
    if (recaptchaContainerRef.current) {
      recaptchaContainerRef.current.innerHTML = '';
    }
  };

  const sendVerificationCode = async () => {
    if (!isValidPhone(phoneNumber)) {
      onError('Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }

    setLoading(true);
    
    // Check if development mode is enabled
    if (process.env.NEXT_PUBLIC_PHONE_AUTH_DEV_MODE === 'true') {
      // Development mode - use mock verification
      console.log('📱 Development mode enabled - using mock verification');
      onError('Development mode: Using mock phone authentication. Enter verification code: 123456');
      (window as any).confirmationResult = {
        confirm: async (code: string) => {
          if (code === '123456') {
            return {
              user: {
                uid: 'mock-uid-' + Date.now(),
                phoneNumber: phoneNumber,
                getIdToken: async () => 'mock-firebase-token-' + Date.now()
              }
            };
          } else {
            throw { code: 'auth/invalid-verification-code', message: 'Invalid code. Use 123456 in development mode.' };
          }
        }
      };
      setStep('verify');
      setLoading(false);
      return;
    }
    
    let auth: any = null;
    
    try {
      // Production Firebase implementation
      const { signInWithPhoneNumber } = await import('firebase/auth');
      const firebaseImports = await import('@/lib/firebase');
      auth = firebaseImports.auth;
      const { setupRecaptcha } = firebaseImports;

      console.log('🔍 Starting phone verification process...');
      console.log('📱 Phone number:', phoneNumber);
      console.log('🔥 Auth instance:', auth);
      console.log('🏗️ Auth config:', {
        apiKey: auth.config.apiKey?.substring(0, 10) + '...',
        projectId: auth.config.projectId,
        authDomain: auth.config.authDomain
      });

      // Clear existing reCAPTCHA if any
      await cleanupRecaptcha();

      // Wait a bit to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('🤖 Setting up reCAPTCHA...');
      // Setup reCAPTCHA for phone verification
      const recaptchaVerifier = await setupRecaptcha('recaptcha-container');
      recaptchaRef.current = recaptchaVerifier;
      console.log('✅ reCAPTCHA setup complete');

      console.log('📞 Attempting signInWithPhoneNumber...');
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier as any);
      console.log('✅ signInWithPhoneNumber successful:', confirmationResult);
      
      // Store confirmation result for verification step
      (window as any).confirmationResult = confirmationResult;
      
      setStep('verify');
    } catch (error: any) {
      console.error('❌ Phone verification error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        fullError: error
      });
      
      // Let's also check what Firebase is actually trying to do
      if (auth) {
        console.log('🔍 Current Firebase auth state:', {
          currentUser: auth.currentUser,
          appName: auth.app.name,
          authDomain: auth.config.authDomain,
          projectId: auth.config.projectId
        });
      } else {
        console.log('❌ Auth instance not available for debugging');
      }
      
      if (error.code === 'auth/invalid-phone-number') {
        onError('Invalid phone number format.');
      } else if (error.code === 'auth/too-many-requests') {
        onError('Too many attempts. Please try again later.');
      } else if (error.code === 'auth/invalid-app-credential') {
        onError(`Firebase Phone Authentication is not enabled. Error details: ${error.message}. Code: ${error.code}`);
      } else if (error.code === 'auth/app-not-authorized') {
        onError('This domain is not authorized for Firebase Phone Auth. Please add localhost to authorized domains in Firebase Console.');
      } else {
        onError(`${error.code || 'Unknown'}: ${error.message || 'Failed to send verification code'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    console.log('🔐 Verification process started');
    console.log('📝 Entered code:', verificationCode);
    console.log('📝 Code length:', verificationCode?.length);
    
    if (!verificationCode || verificationCode.length < 6) {
      console.log('❌ Invalid code length');
      onError('Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const confirmationResult = (window as any).confirmationResult;
      console.log('🔍 Confirmation result:', confirmationResult);
      
      if (!confirmationResult) {
        console.log('❌ No confirmation result found');
        onError('Verification session expired. Please try again.');
        return;
      }

      console.log('📞 Confirming code with Firebase...');
      const result = await confirmationResult.confirm(verificationCode);
      console.log('✅ Firebase confirmation successful:', result);
      
      const firebaseUser = result.user;
      console.log('👤 Firebase user:', firebaseUser);

      // Handle registration vs login
      if (mode === 'register') {
        console.log('📝 Processing as registration');
        // For registration, create user in Laravel database
        await handleRegistration(firebaseUser);
      } else {
        console.log('🔐 Processing as login');
        // For login, find existing user
        await handleLogin(firebaseUser);
      }

    } catch (error: any) {
      console.error('❌ Code verification error:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.code === 'auth/invalid-verification-code') {
        onError('Invalid verification code. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        onError('Verification code expired. Please request a new one.');
      } else {
        onError(error.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async (firebaseUser: any) => {
    try {
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      console.log('📝 Starting registration process...');
      console.log('👤 Firebase user for registration:', firebaseUser);
      
      const registrationPayload = {
        name: userName || 'Phone User',
        phone: firebaseUser.phoneNumber,
        firebase_uid: firebaseUser.uid,
        firebase_token: idToken,
        provider: 'phone',
      };
      console.log('📦 Registration payload:', registrationPayload);
      
      // Register user in Laravel backend
      console.log('🌐 Making registration request to:', `${process.env.NEXT_PUBLIC_API_URL}/auth/firebase`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(registrationPayload),
      });
      
      console.log('📡 Registration response status:', response.status);
      const responseText = await response.text();
      console.log('📡 Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError);
        throw new Error(`Server returned invalid response: ${responseText}`);
      }

      if (!response.ok) {
        console.error('❌ Registration failed with data:', data);
        throw new Error(data.message || data.error || 'Registration failed');
      }

      console.log('✅ Registration successful:', data);
      console.log('📞 Full API response structure:', JSON.stringify(data, null, 2));
      console.log('📞 Calling onSuccess with full response data');
      onSuccess(data, true);
    } catch (error: any) {
      onError(error.message || 'Registration failed');
    }
  };

  const handleLogin = async (firebaseUser: any) => {
    try {
      console.log('🔐 Starting login process...');
      console.log('👤 Firebase user:', firebaseUser);
      
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      console.log('🎫 Firebase token obtained:', idToken ? 'Present' : 'Missing');
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/firebase`;
      console.log('🌐 API URL:', apiUrl);
      
      const payload = {
        firebase_uid: firebaseUser.uid,
        firebase_token: idToken,
        provider: 'phone',
        name: userName || 'Phone User',
        phone: firebaseUser.phoneNumber,
      };
      console.log('📦 Request payload:', payload);
      
      // Login user via Laravel backend
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('📡 Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError);
        throw new Error(`Server returned invalid response: ${responseText}`);
      }
      
      console.log('📨 Parsed response data:', data);

      if (!response.ok) {
        console.error('❌ Login API error:', data);
        throw new Error(data.message || data.error || 'Login failed');
      }

      console.log('✅ Login successful:', data);
      console.log('📞 Full API response structure:', JSON.stringify(data, null, 2));
      console.log('📞 Calling onSuccess with full response data');
      onSuccess(data, false);
    } catch (error: any) {
      console.error('❌ Login process failed:', error);
      onError(error.message || 'Login failed');
    }
  };

  const resetForm = async () => {
    setStep('phone');
    setVerificationCode('');
    delete (window as any).confirmationResult;
    
    // Clear reCAPTCHA when going back
    await cleanupRecaptcha();
  };

  return (
    <div className="space-y-6">
      {step === 'phone' && (
        <>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              placeholder="Enter phone number (+1234567890)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Include country code (e.g., +1 for US, +44 for UK, +971 for UAE)
            </p>
            {process.env.NEXT_PUBLIC_PHONE_AUTH_DEV_MODE === 'true' && (
              <p className="mt-1 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                📱 Development mode: Use any phone number format and verification code 123456
              </p>
            )}
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

          {/* reCAPTCHA container */}
          <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
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
              Enter the verification code sent to {phoneNumber}
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
              onClick={() => {
                console.log('🔘 Verify button clicked');
                verifyCode();
              }}
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