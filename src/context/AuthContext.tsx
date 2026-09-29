"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { ProfileRow } from "@/types/database.types";
import { supabase } from "@/lib/supabase/client";
import { authService, profileService } from "@/lib/supabase/services";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const res = await profileService.getProfile(userId);
      if (res.data) {
        setProfile(res.data);
      }
    } catch {
      // Non-blocking if profile query fails or offline
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: currentSession } = await authService.getSession();
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            await loadProfile(currentSession.user.id);
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[AuthContext] Session init note:", err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Subscribe to Supabase auth events
    const {
      data: { subscription },
    } = supabase.client.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.signIn(email, password);
      if (res.error) {
        setIsLoading(false);
        return { success: false, error: res.error };
      }

      if (res.data?.session) {
        setSession(res.data.session);
        setUser(res.data.user);
        if (res.data.user) {
          await loadProfile(res.data.user.id);
        }
      }
      setIsLoading(false);
      return { success: true, error: null };
    } catch (err) {
      setIsLoading(false);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to sign in. Please try again.",
      };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const res = await authService.signUp(email, password, fullName);
      if (res.error) {
        setIsLoading(false);
        return { success: false, error: res.error };
      }

      if (res.data?.session) {
        setSession(res.data.session);
        setUser(res.data.user);
        if (res.data.user) {
          await loadProfile(res.data.user.id);
        }
      }
      setIsLoading(false);
      return { success: true, error: null };
    } catch (err) {
      setIsLoading(false);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to sign up. Please try again.",
      };
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } catch {
      // Continue clearing local state regardless
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      // Completely clear any cached application data on logout
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("skillswap_state_v2");
        } catch {
          // Ignore
        }
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
