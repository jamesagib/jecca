import { create } from 'zustand';
import { signInWithPassword, signUpWithEmail, signInWithGoogleIdToken, sendOtp, verifyOtp } from './supabaseApi';
import { storage } from './storage';

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  loading: true,
  error: null,
  initialized: false,
  otpSent: false,
  otpEmail: '',

  setUser: async (user) => {
    set({ user });
    if (user) {
      await storage.saveAuthData(user, useAuthStore.getState().accessToken);
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

  initialize: async () => {
    try {
      set({ loading: true });
      
      // Get auth data from storage
      const authData = await storage.getAuthData();
      
      if (!authData?.user?.id || !authData?.accessToken) {
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
      const supabaseConfig = await storage.getSupabaseConfig();
      
      if (!supabaseConfig?.supabaseUrl || !supabaseConfig?.supabaseAnonKey) {
        set({ 
          user: authData.user,
          accessToken: authData.accessToken,
          loading: false,
          initialized: true
        });
        return;
      }

      // Validate the token
      const response = await fetch(`${supabaseConfig.supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${authData.accessToken}`,
          'apikey': supabaseConfig.supabaseAnonKey
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        const updatedUser = {
          ...authData.user,
          ...userData,
        };
        
        await storage.saveAuthData(updatedUser, authData.accessToken);
        set({ 
          user: updatedUser, 
          accessToken: authData.accessToken,
          loading: false,
          initialized: true 
        });
      } else {
        set({ 
          user: authData.user,
          accessToken: authData.accessToken,
          loading: false,
          initialized: true
        });
      }
    } catch (error) {
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

  signOut: async () => {
    await storage.clearAuthData();
    set({ user: null, accessToken: null });
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
      set({ error: error.message || 'Failed to verify code.', loading: false });
      return null;
    }
  }
}));

export { useAuthStore };