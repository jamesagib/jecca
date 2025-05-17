import { create } from 'zustand';
import { supabase } from '../../utils/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,
  initialized: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null });
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ 
        user: session?.user || null,
        loading: false,
        initialized: true
      });
    } catch (error) {
      set({ 
        error: error.message,
        loading: false,
        initialized: true
      });
    }
  },

  handleAuthStateChange: ({ event, session }) => {
    set({ user: session?.user || null });
  },
}));

export { useAuthStore };