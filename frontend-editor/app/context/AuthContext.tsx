// src/context/AuthContext.tsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('syncscribe_token');
    if (savedToken) setToken(savedToken);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('syncscribe_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('syncscribe_token');
    setToken(null);
  };

  // --- GLOBAL AUTH INTERCEPTOR ---
  useEffect(() => {
    // Store the original fetch function
    const originalFetch = window.fetch;

    // Override the global fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // If ANY request returns a 401 Unauthorized, automatically log the user out
      if (response.status === 401) {
        console.warn('Token expired or unauthorized. Logging out...');
        logout();
      }
      
      return response;
    };

    // Cleanup: restore original fetch when the component unmounts
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);