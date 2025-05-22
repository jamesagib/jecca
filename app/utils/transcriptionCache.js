import { storage } from './storage';

const CACHE_KEY = 'transcription_cache';
const MAX_CACHE_SIZE = 100;
const SIMILARITY_THRESHOLD = 0.8;

export const transcriptionCache = {
  async getCache() {
    try {
      const cacheStr = await storage.getItem(CACHE_KEY);
      return cacheStr ? JSON.parse(cacheStr) : [];
    } catch (error) {
      console.error('Failed to get transcription cache:', error);
      return [];
    }
  },

  async addToCache(rawText, cleanedText) {
    try {
      const cache = await this.getCache();
      
      // Add new entry
      cache.push({
        raw: rawText,
        cleaned: cleanedText,
        timestamp: Date.now(),
        uses: 1
      });

      // Sort by usage count and timestamp
      cache.sort((a, b) => {
        if (b.uses === a.uses) {
          return b.timestamp - a.timestamp;
        }
        return b.uses - a.uses;
      });

      // Keep only most used/recent entries
      if (cache.length > MAX_CACHE_SIZE) {
        cache.length = MAX_CACHE_SIZE;
      }

      await storage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to add to transcription cache:', error);
    }
  },

  calculateSimilarity(str1, str2) {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  },

  async findMatch(rawText) {
    try {
      const cache = await this.getCache();
      
      // Find best matching entry
      let bestMatch = null;
      let highestSimilarity = 0;

      for (const entry of cache) {
        const similarity = this.calculateSimilarity(rawText, entry.raw);
        if (similarity > highestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
          highestSimilarity = similarity;
          bestMatch = entry;
        }
      }

      if (bestMatch) {
        // Update usage count
        bestMatch.uses++;
        bestMatch.timestamp = Date.now();
        await storage.setItem(CACHE_KEY, JSON.stringify(cache));
        
        return bestMatch.cleaned;
      }

      return null;
    } catch (error) {
      console.error('Failed to find match in cache:', error);
      return null;
    }
  },

  async clearOldEntries() {
    try {
      const cache = await this.getCache();
      const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      const filteredCache = cache.filter(entry => 
        entry.timestamp > oneMonthAgo || entry.uses > 5
      );
      
      await storage.setItem(CACHE_KEY, JSON.stringify(filteredCache));
    } catch (error) {
      console.error('Failed to clear old cache entries:', error);
    }
  }
}; 