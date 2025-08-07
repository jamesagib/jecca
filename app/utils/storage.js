import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Error setting item:', error);
    }
  }

  async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }

  async clear() {
    try {
      if (Platform.OS === 'web') {
        localStorage.clear();
      } else {
        // For SecureStore, we need to get all keys and delete them individually
        // Since SecureStore doesn't have a clear method, we'll clear the most common keys
        const keysToClear = [
          'tasks',
          'selected_time',
          'remove_reminder_toggle',
          'delete_previous_day_tasks',
          'onboardingComplete',
          'settings'
        ];
        
        for (const key of keysToClear) {
          await SecureStore.deleteItemAsync(key);
        }
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  async cleanupPreviousDayTasks() {
    try {
      const tasksData = await this.getItem('tasks');
      if (!tasksData) return;

      const allTasks = JSON.parse(tasksData);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Filter out tasks from previous days
      const currentAndFutureTasks = allTasks.filter(task => {
        const taskDate = task.date;
        return taskDate >= today;
      });

      // Save the filtered tasks back to storage
      await this.setItem('tasks', JSON.stringify(currentAndFutureTasks));
      
      console.log(`Cleaned up ${allTasks.length - currentAndFutureTasks.length} previous day tasks`);
    } catch (error) {
      console.error('Error cleaning up previous day tasks:', error);
    }
  }
}

export const storage = new Storage();