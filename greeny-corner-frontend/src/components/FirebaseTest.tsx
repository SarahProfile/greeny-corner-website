'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';

export default function FirebaseTest() {
  const [status, setStatus] = useState('Testing Firebase connection...');
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const testFirebase = async () => {
      try {
        // Test Firebase configuration
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
        };
        
        setConfig(firebaseConfig);
        
        // Test auth connection
        if (auth) {
          setStatus(`✅ Firebase Auth initialized successfully`);
          
          // Test phone auth specifically
          const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
          setStatus(`✅ Firebase Phone Auth modules loaded`);
        } else {
          setStatus('❌ Firebase Auth not initialized');
        }
      } catch (error: any) {
        setStatus(`❌ Error: ${error.message}`);
        console.error('Firebase test error:', error);
      }
    };

    testFirebase();
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', margin: '20px', borderRadius: '8px' }}>
      <h3>Firebase Connection Test</h3>
      <p><strong>Status:</strong> {status}</p>
      
      <h4>Configuration:</h4>
      <pre style={{ fontSize: '12px', backgroundColor: '#fff', padding: '10px', borderRadius: '4px' }}>
        {JSON.stringify(config, null, 2)}
      </pre>
    </div>
  );
}