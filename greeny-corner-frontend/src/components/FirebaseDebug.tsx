'use client';

import { useState } from 'react';

export default function FirebaseDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkFirebaseConfig = async () => {
    setLoading(true);
    try {
      // Check environment variables
      const envConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
      };

      // Import Firebase
      const { auth } = await import('@/lib/firebase');
      
      const info = {
        environment: {
          ...envConfig,
          allPresent: Object.values(envConfig).every(v => v !== undefined)
        },
        firebase: {
          authInitialized: !!auth,
          currentUser: auth.currentUser?.uid || 'No user signed in',
          appName: auth.app.name,
          projectId: auth.app.options.projectId
        },
        tests: {
          envVariablesLoaded: !!envConfig.apiKey,
          authDomainValid: envConfig.authDomain?.includes('firebaseapp.com'),
          projectIdValid: !!envConfig.projectId
        }
      };

      setDebugInfo(info);
    } catch (error: any) {
      setDebugInfo({
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const testPhoneAuthConfig = async () => {
    setLoading(true);
    try {
      // Test if we can create a RecaptchaVerifier (this will fail if phone auth isn't configured)
      const { RecaptchaVerifier } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      
      // Create a test container
      const testDiv = document.createElement('div');
      testDiv.id = 'test-recaptcha-container';
      document.body.appendChild(testDiv);
      
      try {
        const verifier = new RecaptchaVerifier(auth, 'test-recaptcha-container', {
          size: 'invisible',
          callback: () => console.log('Test reCAPTCHA solved')
        });
        
        setDebugInfo({
          ...debugInfo,
          phoneAuth: {
            recaptchaVerifier: 'Created successfully',
            status: 'Phone Auth appears to be configured'
          }
        });
      } catch (authError: any) {
        setDebugInfo({
          ...debugInfo,
          phoneAuth: {
            error: authError.message,
            code: authError.code,
            status: 'Phone Auth NOT configured properly'
          }
        });
      } finally {
        // Clean up test container
        document.body.removeChild(testDiv);
      }
      
    } catch (error: any) {
      setDebugInfo({
        ...debugInfo,
        phoneAuth: {
          error: error.message,
          status: 'Failed to test phone auth'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Firebase Configuration Debug</h3>
      
      <div className="space-x-4 mb-6">
        <button
          onClick={checkFirebaseConfig}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Firebase Config'}
        </button>
        
        <button
          onClick={testPhoneAuthConfig}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Phone Auth'}
        </button>
      </div>

      {debugInfo && (
        <div className="bg-white p-4 rounded border">
          <pre className="text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}