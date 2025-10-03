import { useState, useEffect } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut, 
  ConfirmationResult,
  RecaptchaVerifier 
} from 'firebase/auth';
import { auth, signInWithGoogle, sendPhoneVerification, setupRecaptcha } from '@/lib/firebase';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await signInWithGoogle();
      
      // Send user data to Laravel backend
      if (user) {
        const idToken = await user.getIdToken();
        await sendUserToBackend({
          firebase_token: idToken,
          firebase_uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email || '',
          avatar: user.photoURL || '',
          provider: 'google'
        });
      }
      
      return user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithPhone = async (phoneNumber: string): Promise<ConfirmationResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const recaptchaVerifier = await setupRecaptcha('recaptcha-container');
      const confirmationResult = await sendPhoneVerification(phoneNumber, recaptchaVerifier as any);
      
      return confirmationResult;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneCode = async (confirmationResult: ConfirmationResult, code: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      
      // Send user data to Laravel backend
      if (user) {
        const idToken = await user.getIdToken();
        await sendUserToBackend({
          firebase_token: idToken,
          firebase_uid: user.uid,
          name: user.displayName || 'Phone User',
          email: user.email || '',
          phone: user.phoneNumber || '',
          provider: 'phone'
        });
      }
      
      return user;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Optionally call Laravel logout endpoint
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      localStorage.removeItem('token');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const sendUserToBackend = async (userData: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with backend');
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Backend authentication error:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    loginWithGoogle,
    loginWithPhone,
    verifyPhoneCode,
    logout,
  };
};