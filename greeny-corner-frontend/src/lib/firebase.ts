import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPopup, signInWithPhoneNumber, PhoneAuthProvider } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAnalytics, logEvent, isSupported as isAnalyticsSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firebase Analytics (only on client side)
let analytics: any = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('📊 Firebase Analytics initialized with ID:', process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID);
    }
  }).catch((err) => {
    console.log('Analytics not supported:', err);
  });
}

// Helper function to log custom events
export const logAnalyticsEvent = (eventName: string, eventParams?: any) => {
  if (analytics) {
    logEvent(analytics, eventName, eventParams);
  }
};

// Export analytics instance
export { analytics };

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Phone Auth Provider
export const phoneProvider = new PhoneAuthProvider(auth);

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

// Phone Number Verification
export const sendPhoneVerification = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('Phone verification error:', error);
    throw error;
  }
};

// Global variable to track reCAPTCHA instances
let globalRecaptchaVerifier: any = null;

// Setup reCAPTCHA with improved cleanup
export const setupRecaptcha = (containerId: string) => {
  return new Promise((resolve, reject) => {
    // First, clean up any existing reCAPTCHA
    if (globalRecaptchaVerifier) {
      try {
        globalRecaptchaVerifier.clear();
        globalRecaptchaVerifier = null;
        console.log('🧹 Cleaned up previous reCAPTCHA instance');
      } catch (e) {
        console.log('Previous reCAPTCHA cleanup error:', e);
      }
    }

    // Ensure the container exists and is clean
    const container = document.getElementById(containerId);
    if (!container) {
      reject(new Error(`reCAPTCHA container with id "${containerId}" not found`));
      return;
    }
    
    // Clear container completely
    container.innerHTML = '';
    
    // Also check for any existing reCAPTCHA widgets and remove them
    const existingWidgets = document.querySelectorAll('[data-widget-id]');
    existingWidgets.forEach(widget => {
      if (widget.parentElement === container) {
        widget.remove();
      }
    });

    // Add a delay to ensure cleanup is complete
    setTimeout(() => {
      try {
        console.log('🤖 Creating new reCAPTCHA verifier...');
        
        const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
          callback: (response: any) => {
            console.log('reCAPTCHA solved successfully');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
          },
          'error-callback': (error: any) => {
            console.error('reCAPTCHA error:', error);
          }
        });

        // Store globally for cleanup
        globalRecaptchaVerifier = recaptchaVerifier;

        // Initialize messaging with VAPID key if available
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY !== 'YOUR_VAPID_KEY_HERE') {
          isSupported().then((supported) => {
            if (supported) {
              try {
                const messaging = getMessaging();
                console.log('📡 Firebase messaging initialized');
              } catch (e) {
                console.log('Messaging setup skipped:', e);
              }
            }
          });
        }
        
        console.log('✅ reCAPTCHA verifier created successfully');
        resolve(recaptchaVerifier);
      } catch (error: any) {
        console.error('❌ reCAPTCHA creation failed:', error);
        reject(error);
      }
    }, 200);
  });
};

// Export cleanup function
export const clearRecaptcha = () => {
  if (globalRecaptchaVerifier) {
    try {
      globalRecaptchaVerifier.clear();
      globalRecaptchaVerifier = null;
      console.log('🧹 Global reCAPTCHA cleared');
    } catch (e) {
      console.log('Global reCAPTCHA cleanup error:', e);
    }
  }
};

export default app;