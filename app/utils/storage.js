import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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
}

export const storage = new Storage();