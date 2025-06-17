import { create } from 'zustand';
import { storage } from '../utils/storage';

const TOGGLE_KEY = 'remove_reminder_toggle';

const useSettingsStore = create((set) => ({
  removeAfterCompletion: false,
  
  setRemoveAfterCompletion: async (value) => {
    set({ removeAfterCompletion: value });
    await storage.setItem(TOGGLE_KEY, value.toString());
  },
  
  loadSettings: async () => {
    const storedToggle = await storage.getItem(TOGGLE_KEY);
    set({ removeAfterCompletion: storedToggle === 'true' });
  }
}));

export default useSettingsStore; 