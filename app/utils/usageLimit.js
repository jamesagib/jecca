import { storage } from './storage';

const USAGE_KEY = 'voice_recording_usage';
const MONTHLY_LIMIT = 50; // Maximum recordings per month

export const usageLimit = {
  async incrementUsage() {
    try {
      const currentUsage = await this.getCurrentUsage();
      const newUsage = {
        count: currentUsage.count + 1,
        month: currentUsage.month,
      };
      
      await storage.setItem(USAGE_KEY, JSON.stringify(newUsage));
      return newUsage.count;
    } catch (error) {
      console.error('Failed to increment usage:', error);
      return 0;
    }
  },

  async getCurrentUsage() {
    try {
      const usageStr = await storage.getItem(USAGE_KEY);
      const currentMonth = new Date().getMonth();
      
      if (!usageStr) {
        return { count: 0, month: currentMonth };
      }

      const usage = JSON.parse(usageStr);
      
      // Reset if it's a new month
      if (usage.month !== currentMonth) {
        const newUsage = { count: 0, month: currentMonth };
        await storage.setItem(USAGE_KEY, JSON.stringify(newUsage));
        return newUsage;
      }

      return usage;
    } catch (error) {
      console.error('Failed to get current usage:', error);
      return { count: 0, month: new Date().getMonth() };
    }
  },

  async canRecord() {
    const usage = await this.getCurrentUsage();
    return usage.count < MONTHLY_LIMIT;
  },

  async getRemainingCount() {
    const usage = await this.getCurrentUsage();
    return Math.max(0, MONTHLY_LIMIT - usage.count);
  },
}; 