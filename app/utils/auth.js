import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { signInWithPassword, signUpWithEmail, signInWithGoogleIdToken, sendOtp, verifyOtp } from '../../utils/supabaseApi';

WebBrowser.maybeCompleteAuthSession();

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  loading: true,
  error: null,
  initialized: false,
  otpSent: false,
  otpEmail: '',
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await signInWithPassword(email, password);
      if (data.error) throw new Error(data.error.message);
      set({ user: data.user, accessToken: data.access_token, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await signUpWithEmail(email, password);
      if (data.error) throw new Error(data.error.message);
      set({ user: data.user, accessToken: data.access_token, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  signInWithGoogle: async (idToken) => {
    set({ loading: true, error: null });
    try {
      console.log(makeRedirectUri({ useProxy: true }));
      const data = await signInWithGoogleIdToken(idToken);
      if (data.error) throw new Error(data.error.message);
      set({ user: data.user, accessToken: data.access_token, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  signOut: async () => {
    set({ user: null, accessToken: null });
  },

  initialize: async () => {
    // You may want to load user/token from storage here
    set({ loading: false, initialized: true });
  },

  handleAuthStateChange: ({ event, session }) => {
    // Not needed with REST API, but keep for compatibility
    set({ user: session?.user || null });
  },

  sendOtp: async (email) => {
    set({ loading: true, error: null, otpSent: false, otpEmail: '' });
    try {
      const { data, error } = await sendOtp(email);
      if (error) throw new Error(data.error_description || data.error || 'Failed to send code.');
      set({ otpSent: true, otpEmail: email, loading: false });
      return { data };
    } catch (error) {
      set({ error: error.message || 'Failed to send code.', loading: false });
      return null;
    }
  },

  verifyOtp: async (email, token) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await verifyOtp(email, token);
      if (error) throw new Error(error.message || 'Invalid code.');
      set({ user: data.user, accessToken: data.session?.access_token, loading: false, otpSent: false, otpEmail: '' });
      return { data };
    } catch (error) {
      set({ error: error.message || 'Invalid code.', loading: false });
      return null;
    }
  },
}));

export { useAuthStore };