import { create } from 'zustand';

export const colors = {
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
};

// Create a store slice for theme
const createThemeSlice = (set, get) => ({
  colors,
  getColors: () => colors
});

// Create the store
export const useThemeStore = create(createThemeSlice); 