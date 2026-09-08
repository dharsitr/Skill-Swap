import { supabase } from '@/lib/supabaseClient';
import type { LoginCredentials, RegisterCredentials } from './authTypes';
import type { Session, User } from '@supabase/supabase-js';

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User | null; session: Session | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password,
    });

    if (error) {
      throw new Error(mapAuthError(error.message));
    }

    return { user: data.user, session: data.session };
  },

  async register(credentials: RegisterCredentials): Promise<{ user: User | null; session: Session | null }> {
    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email.trim(),
      password: credentials.password,
      options: {
        data: {
          display_name: credentials.displayName.trim(),
          college_name: credentials.collegeName.trim(),
        },
      },
    });

    if (error) {
      throw new Error(mapAuthError(error.message));
    }

    return { user: data.user, session: data.session };
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(mapAuthError(error.message));
    }
  },

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return null;
    }
    return data.session;
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return subscription;
  },
};

function mapAuthError(rawMessage: string): string {
  const msg = rawMessage.toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'An account with this email already exists.';
  }
  if (msg.includes('password should be at least') || msg.includes('weak password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (msg.includes('rate limit')) {
    return 'Too many requests. Please wait a few moments and try again.';
  }
  return rawMessage || 'Authentication failed. Please try again.';
}
