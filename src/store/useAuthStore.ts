import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/services/supabase/client';
import { UserProfile } from '@/types';

interface AuthStoreState {
  user: UserProfile | null;
  isLoading: boolean;
  isGuest: boolean;
  isConfigured: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  continueAsGuest: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isLoading: true,
  isGuest: true,
  isConfigured: isSupabaseConfigured,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });

    if (!isSupabaseConfigured || !supabase) {
      set({ isLoading: false, isGuest: true });
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
            avatarUrl: session.user.user_metadata?.avatar_url,
            createdAt: session.user.created_at,
          },
          isGuest: false,
          isLoading: false,
        });
      } else {
        set({ user: null, isGuest: true, isLoading: false });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
              avatarUrl: session.user.user_metadata?.avatar_url,
              createdAt: session.user.created_at,
            },
            isGuest: false,
          });
        } else {
          set({ user: null, isGuest: true });
        }
      });
    } catch (err: any) {
      console.warn('Auth initialization error:', err.message);
      set({ user: null, isGuest: true, isLoading: false });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    if (!isSupabaseConfigured || !supabase) {
      set({
        isLoading: false,
        error: 'Supabase authentication is not configured yet. Guest mode is fully functional without login!',
      });
      return false;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0],
            avatarUrl: data.user.user_metadata?.avatar_url,
          },
          isGuest: false,
          isLoading: false,
        });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      return false;
    }
  },

  signUpWithEmail: async (email: string, password: string, displayName?: string) => {
    set({ isLoading: true, error: null });

    if (!isSupabaseConfigured || !supabase) {
      set({
        isLoading: false,
        error: 'Supabase authentication is not configured. Guest mode is fully operational without login!',
      });
      return false;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            displayName: displayName || email.split('@')[0],
          },
          isGuest: false,
          isLoading: false,
        });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      return false;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
    set({ user: null, isGuest: true, isLoading: false, error: null });
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    if (!isSupabaseConfigured || !supabase) {
      set({
        isLoading: false,
        error: 'Supabase authentication is not configured.',
      });
      return false;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Password reset request failed', isLoading: false });
      return false;
    }
  },

  continueAsGuest: () => {
    set({ isGuest: true, error: null });
  },

  clearError: () => set({ error: null }),
}));

