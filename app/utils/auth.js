import { create } from 'zustand';
import { signInWithPassword, signUpWithEmail, signInWithGoogleIdToken, sendOtp, verifyOtp } from '../../utils/supabaseApi';
import { storage } from './storage';

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

  signOut: async () => {
    await storage.clearAuthData();
    set({ user: null, accessToken: null });
  },

  initialize: async () => {
    try {
      console.log('Starting auth initialization');
      set({ loading: true });
      
      // Get auth data from storage
      let authData = null;
      try {
        authData = await storage.getAuthData();
        console.log('Auth data loaded:', { 
          hasUser: !!authData?.user, 
          hasToken: !!authData?.accessToken 
        });
      } catch (storageError) {
        console.warn('Error loading auth data:', storageError);
      }
      
      if (!authData?.user?.id || !authData?.accessToken) {
        console.log('No valid auth data found during initialization');
        try {
          await storage.clearAuthData();
        } catch (clearError) {
          console.warn('Error clearing auth data:', clearError);
        }
        set({ 
          user: null,
          accessToken: null,
          loading: false, 
          initialized: true 
        });
        return;
      }

      // Get Supabase config
      let supabaseConfig = null;
      try {
        supabaseConfig = await storage.getSupabaseConfig();
        console.log('Supabase config loaded:', { 
          hasUrl: !!supabaseConfig?.supabaseUrl, 
          hasKey: !!supabaseConfig?.supabaseAnonKey 
        });
      } catch (configError) {
        console.warn('Error loading Supabase config:', configError);
      }
      
      if (!supabaseConfig?.supabaseUrl || !supabaseConfig?.supabaseAnonKey) {
        console.log('Missing Supabase configuration, proceeding in offline mode');
        set({ 
          user: authData.user,
          accessToken: authData.accessToken,
          loading: false,
          initialized: true
        });
        return;
      }

      // Validate the token by making a test API call
      try {
        console.log('Attempting to validate auth token');
        const response = await fetch(`${supabaseConfig.supabaseUrl}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${authData.accessToken}`,
            'apikey': supabaseConfig.supabaseAnonKey
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
          try {
            await storage.saveAuthData(updatedUser, authData.accessToken);
          } catch (saveError) {
            console.warn('Error saving updated auth data:', saveError);
          }
          
          set({ 
            user: updatedUser, 
            accessToken: authData.accessToken,
            loading: false,
            initialized: true 
          });
          return;
        } else {
          console.log('Auth token validation failed, proceeding with stored data');
          set({ 
            user: authData.user,
            accessToken: authData.accessToken,
            loading: false,
            initialized: true
          });
          return;
        }
      } catch (validationError) {
        console.error('Error validating auth token, proceeding with stored data:', validationError);
        set({ 
          user: authData.user,
          accessToken: authData.accessToken,
          loading: false,
          initialized: true
        });
        return;
      }
    } catch (error) {
      console.error('Fatal error in auth initialization:', error);
      try {
        await storage.clearAuthData();
      } catch (clearError) {
        console.warn('Error clearing auth data after fatal error:', clearError);
      }
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
      
      if (data?.user && data?.access_token) {
        await storage.saveAuthData(data.user, data.access_token);
        set({ 
          user: data.user, 
          accessToken: data.access_token,
          loading: false,
          otpSent: false,
          otpEmail: ''
        });
      }
      
      return { data };
    } catch (error) {
      set({ error: error.message || 'Failed to verify code.', loading: false });
      return null;
    }
  }
}));

export { useAuthStore };