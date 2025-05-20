import { create } from 'zustand';
import { storage } from './storage';

export const colors = {
  light: {
    primary: '#000000',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#FF0000',
    success: '#4CAF50',
    buttonText: '#FFFFFF',
    buttonBackground: '#000000',
    inputBackground: '#FFFFFF',
    modalBackground: '#FFFFFF',
    cardBackground: '#FFFFFF',
    shadow: '#000000',
  },
  dark: {
    primary: '#FFFFFF',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    border: '#333333',
    error: '#CF6679',
    success: '#4CAF50',
    buttonText: '#000000',
    buttonBackground: '#FFFFFF',
    inputBackground: '#1E1E1E',
    modalBackground: '#1E1E1E',
    cardBackground: '#1E1E1E',
    shadow: '#000000',
  }
};

export const useThemeStore = create((set) => ({
  isDarkMode: false,
  initialize: async () => {
    try {
      const savedTheme = await storage.getItem('isDarkMode');
      set({ isDarkMode: savedTheme === 'true' });
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  },
  toggleTheme: async () => {
    set((state) => {
      const newIsDarkMode = !state.isDarkMode;
      storage.setItem('isDarkMode', String(newIsDarkMode));
      return { isDarkMode: newIsDarkMode };
    });
  },
  getColors: () => {
    const state = useThemeStore.getState();
    return colors[state.isDarkMode ? 'dark' : 'light'];
  }
})); 