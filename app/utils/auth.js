import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { signInWithPassword, signUpWithEmail, signInWithGoogleIdToken, sendOtp, verifyOtp } from '../../utils/supabaseApi';
import { storage } from './storage';

WebBrowser.maybeCompleteAuthSession();

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  loading: true,
  error: null,
  initialized: false,
  otpSent: false,
  otpEmail: '',

  setUser: (user) => {
    set({ user });
    if (user) {
      storage.saveAuthData(user, useAuthStore.getState().accessToken);
    }
  },

  setAccessToken: (accessToken) => {
    set({ accessToken });
    if (accessToken) {
      storage.saveAuthData(useAuthStore.getState().user, accessToken);
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await signInWithPassword(email, password);
      if (data.error) throw new Error(data.error.message);
      await storage.saveAuthData(data.user, data.access_token);
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
      await storage.saveAuthData(data.user, data.access_token);
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
      const redirectUri = makeRedirectUri({ 
        useProxy: true,
        scheme: 'jecca'
      });
      console.log('Using redirect URI:', redirectUri);
      
      const data = await signInWithGoogleIdToken(idToken);
      if (data.error) throw new Error(data.error.message);
      
      if (!data.user || !data.access_token) {
        throw new Error('Invalid response from Supabase - missing user or token');
      }
      
      await storage.saveAuthData(data.user, data.access_token);
      set({ user: data.user, accessToken: data.access_token, loading: false });
      return data;
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },

  signOut: async () => {
    await storage.clearAuthData();
    set({ user: null, accessToken: null });
  },

  initialize: async () => {
    try {
      set({ loading: true });
      
      // Get auth data from storage
      const authData = await storage.getAuthData();
      
      if (!authData?.user?.id || !authData?.accessToken) {
        console.log('No valid auth data found during initialization');
        await storage.clearAuthData();
        set({ 
          user: null,
          accessToken: null,
          loading: false, 
          initialized: true 
        });
        return;
      }

      // Get Supabase config
      const { supabaseUrl, supabaseAnonKey } = await storage.getSupabaseConfig();
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase configuration');
        throw new Error('Missing Supabase configuration');
      }

      // Validate the token by making a test API call
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${authData.accessToken}`,
            'apikey': supabaseAnonKey
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('Auth token validated successfully');
          
          // Update user data with latest from server
          const updatedUser = {
            ...authData.user,
            ...userData,
          };
          
          // Save updated user data
          await storage.saveAuthData(updatedUser, authData.accessToken);
          
          set({ 
            user: updatedUser, 
            accessToken: authData.accessToken,
            loading: false,
            initialized: true 
          });
          return;
        } else {
          console.log('Auth token validation failed, clearing auth data');
          throw new Error('Token validation failed');
        }
      } catch (error) {
        console.error('Error validating auth token:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      await storage.clearAuthData();
      set({ 
        user: null,
        accessToken: null,
        loading: false, 
        initialized: true,
        error: error.message 
      });
    }
  },

  handleAuthStateChange: ({ event, session }) => {
    if (session?.user) {
      storage.saveAuthData(session.user, session.access_token);
      set({ user: session.user, accessToken: session.access_token });
    } else {
      set({ user: null, accessToken: null });
    }
  },

  sendOtp: async (email) => {
    set({ loading: true, error: null, otpSent: false, otpEmail: '' });
    try {
      const { data, error } = await sendOtp(email);
      if (error) throw new Error(error.message || 'Failed to send code.');
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
      
      // Ensure we have both user and access_token
      if (!data?.user || !data?.session?.access_token) {
        throw new Error('Invalid response from server');
      }

      // Save auth data first
      await storage.saveAuthData(data.user, data.session.access_token);

      // Then update state
      set({ 
        user: data.user, 
        accessToken: data.session.access_token, 
        loading: false, 
        otpSent: false, 
        otpEmail: '',
        error: null 
      });

      return { data };
    } catch (error) {
      console.error('Error in verifyOtp:', error);
      set({ 
        error: error.message || 'Invalid code.', 
        loading: false,
        user: null,
        accessToken: null
      });
      return null;
    }
  },
}));

export { useAuthStore };