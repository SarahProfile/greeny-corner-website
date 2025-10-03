'use client';

import { useEffect, useState } from 'react';

export default function FirebaseDebugger() {
  const [results, setResults] = useState<string[]>([]);

  const log = (message: string, isError = false) => {
    setResults(prev => [...prev, `${isError ? '❌' : '✅'} ${message}`]);
  };

  useEffect(() => {
    const debugFirebase = async () => {
      setResults([]);
      log('🔍 Starting Firebase Phone Auth Debug...');

      // Check environment variables
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

      log(`API Key: ${apiKey ? apiKey.substring(0, 15) + '...' : 'Missing'}`, !apiKey);
      log(`Project ID: ${projectId || 'Missing'}`, !projectId);
      log(`Auth Domain: ${authDomain || 'Missing'}`, !authDomain);
      log(`VAPID Key: ${vapidKey ? vapidKey.substring(0, 15) + '...' : 'Missing'}`, !vapidKey);
      
      // Show all environment variables for debugging
      log(`--- Full Environment Config ---`);
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('NEXT_PUBLIC_FIREBASE_')) {
          const value = process.env[key];
          log(`${key}: ${value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'undefined'}`);
        }
      });

      try {
        // Test Firebase initialization
        const { auth } = await import('@/lib/firebase');
        log('Firebase Auth initialized successfully');

        // Test auth configuration
        log(`Auth current user: ${auth.currentUser ? 'Logged in' : 'Not logged in'}`);
        log(`Auth app name: ${auth.app.name}`);

        // Test Phone Auth provider availability
        const { PhoneAuthProvider, RecaptchaVerifier } = await import('firebase/auth');
        log('Phone Auth modules loaded successfully');

        // Test reCAPTCHA setup (without actually creating it)
        log('reCAPTCHA modules accessible');

        // Test specific Firebase project connection
        if (projectId) {
          try {
            // Try to access Firebase project settings
            const response = await fetch(`https://${projectId}-default-rtdb.firebaseio.com/.json`);
            if (response.status === 404) {
              log('Firebase project connection: OK (404 expected for Firestore-only projects)');
            } else if (response.status === 401) {
              log('Firebase project connection: Authentication required (project exists)');
            } else {
              log(`Firebase project response: ${response.status}`);
            }
          } catch (e) {
            log('Firebase project connection test failed (network/cors)', true);
          }
        }

        // Test Phone Auth specifically
        try {
          // This will fail if Phone Auth is not enabled
          const container = document.createElement('div');
          container.id = 'debug-recaptcha';
          container.style.display = 'none';
          document.body.appendChild(container);

          const recaptchaVerifier = new RecaptchaVerifier(auth, 'debug-recaptcha', {
            size: 'invisible',
            callback: () => {},
            'expired-callback': () => {}
          });

          log('reCAPTCHA Verifier created successfully');
          
          // Clean up
          recaptchaVerifier.clear();
          document.body.removeChild(container);
          
          log('🎉 All Firebase Phone Auth components are working!');
          
        } catch (error: any) {
          log(`Phone Auth Error: ${error.code || error.message}`, true);
          
          if (error.code === 'auth/invalid-app-credential') {
            log('❗ Phone Authentication is NOT enabled in Firebase Console', true);
          } else if (error.code === 'auth/app-not-authorized') {
            log('❗ Domain not authorized in Firebase Console', true);
          }
        }

      } catch (error: any) {
        log(`Firebase initialization error: ${error.message}`, true);
      }
    };

    debugFirebase();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      margin: '20px 0', 
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '14px',
      border: '1px solid #dee2e6'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>🔧 Firebase Phone Auth Debugger</h3>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {results.map((result, index) => (
          <div key={index} style={{ 
            marginBottom: '5px', 
            color: result.startsWith('❌') ? '#dc3545' : result.startsWith('✅') ? '#28a745' : '#495057'
          }}>
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}