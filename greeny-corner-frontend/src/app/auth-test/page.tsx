'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthTestPage() {
  const [authData, setAuthData] = useState<any>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    
    setAuthData({
      token: token,
      storedUser: storedUser,
      parsedUser: storedUser ? JSON.parse(storedUser) : null,
      contextUser: user,
      contextLoading: loading
    });
  }, [user, loading]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px' }}>
      <h1>🔍 Authentication Debug Page</h1>
      
      <h3>📋 Current Authentication State:</h3>
      <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
        {JSON.stringify(authData, null, 2)}
      </pre>
      
      <h3>🎯 Quick Actions:</h3>
      <button 
        onClick={() => window.location.href = '/login'}
        style={{ margin: '5px', padding: '10px' }}
      >
        Go to Login
      </button>
      
      <button 
        onClick={() => window.location.href = '/my-plants'}
        style={{ margin: '5px', padding: '10px' }}
      >
        Try My Plants
      </button>
      
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        style={{ margin: '5px', padding: '10px', backgroundColor: 'red', color: 'white' }}
      >
        Clear All Auth Data
      </button>
    </div>
  );
}