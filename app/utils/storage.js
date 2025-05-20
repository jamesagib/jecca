import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_STORAGE_KEY = 'auth_data';

class Storage {
  async getItem(key) {
    if (Platform.OS === 'web') {
      const value = localStorage.getItem(key);
      return value;
    }
    return await SecureStore.getItemAsync(key);
  }

  async setItem(key, value) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  }

  async removeItem(key) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }

  // Auth-specific methods
  async saveAuthData(user, accessToken) {
    const authData = JSON.stringify({ user, accessToken });
    await this.setItem(AUTH_STORAGE_KEY, authData);
  }

  async getAuthData() {
    try {
      const authData = await this.getItem(AUTH_STORAGE_KEY);
      if (!authData) {
        console.log('No auth data found in storage');
        return null;
      }
      
      const parsedData = JSON.parse(authData);
      console.log('Retrieved auth data:', {
        hasUser: !!parsedData.user,
        hasToken: !!parsedData.accessToken,
        userId: parsedData.user?.id,
        tokenPreview: parsedData.accessToken ? parsedData.accessToken.substring(0, 10) + '...' : 'none'
      });
      
      return parsedData;
    } catch (error) {
      console.error('Error reading auth data:', error);
      return null;
    }
  }

  async clearAuthData() {
    await this.removeItem(AUTH_STORAGE_KEY);
  }
}

export const storage = new Storage();