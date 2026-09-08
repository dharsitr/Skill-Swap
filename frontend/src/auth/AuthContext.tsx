import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { AuthContextType, LoginCredentials, RegisterCredentials } from './authTypes';
import { authService } from './authService';
import { apiClient } from '@/services/apiClient';
import { queryClient } from '@/lib/queryClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initial session restoration
    authService.getSession().then((initialSession) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.access_token) {
        apiClient.setAuthToken(initialSession.access_token);
      } else {
        apiClient.setAuthToken(null);
      }
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const subscription = authService.onAuthStateChange((currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.access_token) {
        apiClient.setAuthToken(currentSession.access_token);
      } else {
        apiClient.setAuthToken(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      setSession(result.session);
      setUser(result.user);
      if (result.session?.access_token) {
        apiClient.setAuthToken(result.session.access_token);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      const result = await authService.register(credentials);
      setSession(result.session);
      setUser(result.user);
      if (result.session?.access_token) {
        apiClient.setAuthToken(result.session.access_token);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setSession(null);
      setUser(null);
      apiClient.setAuthToken(null);
      queryClient.clear();
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    token: session?.access_token ?? null,
    isAuthenticated: !!user && !!session,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
