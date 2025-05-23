import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const AUTH_STORAGE_KEY = 'auth_data';

class Storage {
  async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key).catch(() => null);
    } catch (error) {
      return null;
    }
  }

  async setItem(key, value) {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value).catch(() => {});
    } catch (error) {
      // Silently fail but don't crash
    }
  }

  async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch (error) {
      // Silently fail but don't crash
    }
  }

  // Auth-specific methods
  async saveAuthData(user, accessToken) {
    try {
      if (!user?.id || !accessToken) return;

      const essentialUserData = {
        id: user.id,
        email: user.email,
        role: user.role,
        app_metadata: user.app_metadata,
        user_metadata: {
          email: user.user_metadata?.email,
          email_verified: user.user_metadata?.email_verified
        }
      };

      const authData = JSON.stringify({
        user: essentialUserData,
        accessToken,
        timestamp: new Date().toISOString()
      });

      await this.setItem(AUTH_STORAGE_KEY, authData);
    } catch (error) {
      // Silently fail but don't crash
    }
  }

  async getAuthData() {
    try {
      const authData = await this.getItem(AUTH_STORAGE_KEY);
      if (!authData) return null;
      
      const parsedData = JSON.parse(authData);
      
      if (!parsedData?.user?.id || !parsedData?.accessToken) {
        await this.clearAuthData();
        return null;
      }

      if (parsedData.timestamp) {
        const tokenAge = Date.now() - new Date(parsedData.timestamp).getTime();
        const MAX_TOKEN_AGE = 24 * 60 * 60 * 1000; // 24 hours
        
        if (tokenAge > MAX_TOKEN_AGE) {
          await this.clearAuthData();
          return null;
        }
      }
      
      return parsedData;
    } catch (error) {
      await this.clearAuthData();
      return null;
    }
  }

  async clearAuthData() {
    try {
      await this.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      // Silently fail but don't crash
    }
  }

  async getSupabaseConfig() {
    try {
      const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Missing Supabase configuration:', {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey
        });
        // Instead of failing, return null values and let the app handle offline mode
        return {
          supabaseUrl: null,
          supabaseAnonKey: null
        };
      }

      return {
        supabaseUrl,
        supabaseAnonKey
      };
    } catch (error) {
      console.error('Error getting Supabase config:', error);
      return {
        supabaseUrl: null,
        supabaseAnonKey: null
      };
    }
  }
}

export const storage = new Storage();