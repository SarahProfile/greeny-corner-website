'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authAPI } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string, phone?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  setAuthenticatedUser: (userData: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 AuthContext: Initializing authentication state');
    try {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');
      
      console.log('🔍 AuthContext: Found token:', token ? 'YES' : 'NO');
      console.log('🔍 AuthContext: Found user data:', storedUser ? 'YES' : 'NO');

      if (token && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && (parsed.id || parsed.uid)) {
            console.log('✅ AuthContext: Restoring user session');
            setUser(parsed);
            console.log('✅ AuthContext: User session restored successfully');
          } else {
            console.log('❌ AuthContext: Invalid user data structure');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
          }
        } catch (parseError) {
          console.error('❌ AuthContext: Error parsing stored user data:', parseError);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      } else {
        console.log('❌ AuthContext: No valid session found');
      }
    } catch (error) {
      console.error('❌ AuthContext: Error during initialization:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
    setLoading(false);
    console.log('🏁 AuthContext: Initialization complete');
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, passwordConfirmation: string, phone?: string) => {
    try {
      const registerData: any = { 
        name, 
        password, 
        password_confirmation: passwordConfirmation 
      };
      
      if (email) {
        registerData.email = email;
      }
      if (phone) {
        registerData.phone = phone;
      }

      const response = await authAPI.register(registerData);
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Handle error silently
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const setAuthenticatedUser = (userData: User, token: string) => {
    console.log('🔄 AuthContext: Setting authenticated user directly');
    console.log('👤 AuthContext: User data:', userData);
    console.log('🎫 AuthContext: Token present:', !!token);
    
    // Store in localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Update context state
    setUser(userData);
    
    console.log('✅ AuthContext: User state updated successfully');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    setAuthenticatedUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};