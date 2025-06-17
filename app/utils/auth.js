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
      console.log(makeRedirectUri({ useProxy: true }));
      const data = await signInWithGoogleIdToken(idToken);
      if (data.error) throw new Error(data.error.message);
      await storage.saveAuthData(data.user, data.access_token);
      set({ user: data.user, accessToken: data.access_token, loading: false });
      return data;
    } catch (error) {
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
      const authData = await storage.getAuthData();
      
      // Check if onboarding is complete
      const onboardingStatus = await storage.getItem('onboardingComplete');
      const hasCompletedOnboarding = onboardingStatus === 'true';
      
      if (authData?.user?.id && authData?.accessToken) {
        // Validate the token by making a test API call
        try {
          const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
              'Authorization': `Bearer ${authData.accessToken}`,
              'apikey': supabaseAnonKey
            }
          });
          
          if (response.ok) {
            console.log('Auth token validated successfully');
            set({ 
              user: authData.user, 
              accessToken: authData.accessToken,
              loading: false,
              initialized: true 
            });
            return;
          } else {
            console.log('Auth token validation failed, clearing auth data');
            await storage.clearAuthData();
            set({ 
              user: null,
              accessToken: null,
              loading: false,
              initialized: true 
            });
            return;
          }
        } catch (error) {
          console.error('Error validating auth token:', error);
          await storage.clearAuthData();
          set({ 
            user: null,
            accessToken: null,
            loading: false,
            initialized: true 
          });
          return;
        }
      }
      
      console.log('No valid auth data found during initialization');
      
      // If onboarding is complete and no user, don't clear auth data
      if (hasCompletedOnboarding) {
        console.log('Onboarding complete, keeping existing auth state');
        set({ 
          user: authData?.user || null,
          accessToken: authData?.accessToken || null,
          loading: false, 
          initialized: true 
        });
      } else {
        set({ 
          user: null,
          accessToken: null,
          loading: false, 
          initialized: true 
        });
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
    }
    set({ user: session?.user || null });
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
      
      // Ensure we have both user and session data
      if (!data.user || !data.session) {
        throw new Error('Invalid response from server');
      }

      // Save auth data and update state
      await storage.saveAuthData(data.user, data.session.access_token);
      set({ 
        user: data.user, 
        accessToken: data.session.access_token, 
        loading: false, 
        otpSent: false, 
        otpEmail: '',
        initialized: true
      });

      // Set onboarding complete since we have a valid user
      await storage.setItem('onboardingComplete', 'true');
      
      return { data };
    } catch (error) {
      set({ error: error.message || 'Invalid code.', loading: false });
      return null;
    }
  },
}));

export { useAuthStore };