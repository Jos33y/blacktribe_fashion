/*
 * BLACKTRIBE FASHION — AUTH STORE
 * Zustand store for authentication state.
 *
 * Auth flow:
 *   initialize() called once from App.jsx
 *   → checks existing session
 *   → sets up onAuthStateChange listener
 *   → fetches profile from profiles table
 *
 * All auth operations go through Supabase JS SDK directly.
 * The server never touches credentials.
 * Server only verifies JWT on protected API routes.
 */

import { create } from 'zustand';
import { supabase } from '../utils/supabase';
import { clearWishlistCache } from '../hooks/useWishlist';

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,

  /* ─── Derived getters ─── */
  get isAuthenticated() { return get().session !== null; },
  get isAdmin() {
    const role = get().profile?.role;
    return role === 'admin' || role === 'superadmin';
  },
  get isSuperAdmin() { return get().profile?.role === 'superadmin'; },
  get accessToken() { return get().session?.access_token || null; },


  /* ═══════════════════════════════════════════════════════════
     INITIALIZE — Call once from App.jsx
     ═══════════════════════════════════════════════════════════ */

  initialize: () => {
    const { _fetchProfile } = get();

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user || null,
        loading: false,
      });

      if (session?.user) {
        _fetchProfile(session.user.id);
      }
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        set({
          session,
          user: session?.user || null,
        });

        if (event === 'SIGNED_IN' && session?.user) {
          _fetchProfile(session.user.id);
        }

        if (event === 'SIGNED_OUT') {
          set({ profile: null });
          clearWishlistCache();
        }

        if (event === 'TOKEN_REFRESHED') {
          // Session updated, user stays the same
        }
      }
    );

    // Store cleanup function (called if needed)
    set({ _unsubscribe: () => subscription.unsubscribe() });
  },


  /* ═══════════════════════════════════════════════════════════
     PASSWORDLESS OTP (Primary auth flow)
     ═══════════════════════════════════════════════════════════ */

  /**
   * Send a 6-digit OTP code to the email.
   * Supabase handles the email delivery via Resend SMTP.
   */
  sendOtp: async (email) => {
    set({ error: null });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      set({ error: error.message });
      return false;
    }

    return true;
  },

  /**
   * Verify the 6-digit OTP code.
   * On success, Supabase triggers onAuthStateChange → SIGNED_IN.
   */
  verifyOtp: async (email, token) => {
    set({ error: null });

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      set({ error: error.message });
      return false;
    }

    return true;
  },


  /* ═══════════════════════════════════════════════════════════
     EMAIL + PASSWORD (Secondary auth flow)
     ═══════════════════════════════════════════════════════════ */

  signUp: async (email, password) => {
    set({ error: null });

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      set({ error: error.message });
      return false;
    }

    return true;
  },

  signInWithPassword: async (email, password) => {
    set({ error: null });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase error messages to our content doc messages
      const message = error.message === 'Invalid login credentials'
        ? 'Incorrect password.'
        : error.message;
      set({ error: message });
      return false;
    }

    return true;
  },


  /* ═══════════════════════════════════════════════════════════
     PASSWORD RESET
     ═══════════════════════════════════════════════════════════ */

  sendPasswordReset: async (email) => {
    set({ error: null });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });

    if (error) {
      set({ error: error.message });
      return false;
    }

    return true;
  },

  updatePassword: async (newPassword) => {
    set({ error: null });

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      set({ error: error.message });
      return false;
    }

    return true;
  },


  /* ═══════════════════════════════════════════════════════════
     SIGN OUT
     ═══════════════════════════════════════════════════════════ */

  signOut: async () => {
    set({ error: null });

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[auth] Sign out error:', error);
    }

    // onAuthStateChange handles clearing state
    return true;
  },


  /* ═══════════════════════════════════════════════════════════
     PROFILE (from profiles table)
     ═══════════════════════════════════════════════════════════ */

  /**
   * Fetch profile from profiles table. Called on sign in.
   * Profile includes: full_name, phone, role, permissions.
   */
  _fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone, role, permissions')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[auth] Failed to fetch profile:', error);
      set({ profile: null });
      return;
    }

    set({ profile: data });
  },

  /**
   * Update profile fields. Used from Account settings.
   */
  updateProfile: async ({ full_name, phone }) => {
    const userId = get().user?.id;
    if (!userId) return false;

    set({ error: null });

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      set({ error: error.message });
      return false;
    }

    // Update local profile state
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    }));

    return true;
  },


  /* ═══════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════ */

  /** Get current access token for API Authorization headers. */
  getAccessToken: () => get().session?.access_token || null,

  /** Clear any displayed error. */
  clearError: () => set({ error: null }),

  /** Cleanup subscription (called on unmount if needed). */
  _unsubscribe: null,
}));

export default useAuthStore;
