import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const AUTH_STORAGE_KEY = 'auth_data';

class Storage {
  async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        const value = localStorage.getItem(key);
        return value;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error reading item ${key}:`, error);
      return null;
    }
  }

  async setItem(key, value) {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  }

  async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  }

  // Auth-specific methods
  async saveAuthData(user, accessToken) {
    try {
      if (!user?.id || !accessToken) {
        console.warn('Invalid auth data:', { 
          hasUserId: !!user?.id, 
          hasToken: !!accessToken 
        });
        return;
      }

      const authData = JSON.stringify({
        user,
        accessToken,
        timestamp: new Date().toISOString()
      });

      await this.setItem(AUTH_STORAGE_KEY, authData);
      
      console.log('Auth data saved successfully:', {
        userId: user.id,
        tokenPreview: `${accessToken.substring(0, 10)}...`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  }

  async getAuthData() {
    try {
      const authData = await this.getItem(AUTH_STORAGE_KEY);
      if (!authData) {
        console.log('No auth data found in storage');
        return null;
      }
      
      let parsedData;
      try {
        parsedData = JSON.parse(authData);
      } catch (e) {
        console.error('Failed to parse auth data:', e);
        await this.clearAuthData();
        return null;
      }
      
      // Validate the structure of the auth data
      if (!parsedData?.user?.id || !parsedData?.accessToken) {
        console.warn('Invalid auth data structure:', {
          hasUser: !!parsedData?.user,
          hasUserId: !!parsedData?.user?.id,
          hasToken: !!parsedData?.accessToken
        });
        await this.clearAuthData();
        return null;
      }

      // Check if the token has expired (if we have expiry info)
      if (parsedData.timestamp) {
        const tokenAge = Date.now() - new Date(parsedData.timestamp).getTime();
        const MAX_TOKEN_AGE = 24 * 60 * 60 * 1000; // 24 hours
        
        if (tokenAge > MAX_TOKEN_AGE) {
          console.log('Auth token has expired');
          await this.clearAuthData();
          return null;
        }
      }

      console.log('Retrieved valid auth data:', {
        userId: parsedData.user.id,
        tokenPreview: `${parsedData.accessToken.substring(0, 10)}...`,
        timestamp: parsedData.timestamp
      });
      
      return parsedData;
    } catch (error) {
      console.error('Error reading auth data:', error);
      await this.clearAuthData();
      return null;
    }
  }

  async clearAuthData() {
    try {
      await this.removeItem(AUTH_STORAGE_KEY);
      console.log('Auth data cleared successfully');
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  }

  async getSupabaseConfig() {
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      });
    }

    return {
      supabaseUrl,
      supabaseAnonKey
    };
  }
}

export const storage = new Storage();