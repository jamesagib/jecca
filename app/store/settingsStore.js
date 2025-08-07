import { create } from 'zustand';
import { storage } from '../utils/storage';

const TOGGLE_KEY = 'remove_reminder_toggle';
const DELETE_PREVIOUS_DAY_KEY = 'delete_previous_day_tasks';

const useSettingsStore = create((set) => ({
  removeAfterCompletion: false,
  deletePreviousDayTasks: false,
  
  setRemoveAfterCompletion: async (value) => {
    set({ removeAfterCompletion: value });
    await storage.setItem(TOGGLE_KEY, value.toString());
  },
  
  setDeletePreviousDayTasks: async (value) => {
    set({ deletePreviousDayTasks: value });
    await storage.setItem(DELETE_PREVIOUS_DAY_KEY, value.toString());
  },
  
  loadSettings: async () => {
    const storedToggle = await storage.getItem(TOGGLE_KEY);
    const storedDeletePrevious = await storage.getItem(DELETE_PREVIOUS_DAY_KEY);
    set({ 
      removeAfterCompletion: storedToggle === 'true',
      deletePreviousDayTasks: storedDeletePrevious === 'true'
    });
  }
}));

export default useSettingsStore; 