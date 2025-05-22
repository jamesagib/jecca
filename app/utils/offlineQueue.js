import { storage } from './storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = 'offline_voice_queue';
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

export const offlineQueue = {
  async addToQueue(audioUri) {
    try {
      // Get existing queue
      const queue = await this.getQueue();
      
      // Add new item
      queue.push({
        audioUri,
        retries: 0,
        timestamp: Date.now(),
      });
      
      // Save updated queue
      await storage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
    }
  },

  async getQueue() {
    try {
      const queueStr = await storage.getItem(QUEUE_KEY);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch (error) {
      console.error('Failed to get offline queue:', error);
      return [];
    }
  },

  async removeFromQueue(audioUri) {
    try {
      const queue = await this.getQueue();
      const updatedQueue = queue.filter(item => item.audioUri !== audioUri);
      await storage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Failed to remove from offline queue:', error);
    }
  },

  async processQueue(onTranscriptionComplete) {
    const queue = await this.getQueue();
    if (queue.length === 0) return;

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) return;

    for (const item of queue) {
      try {
        if (item.retries >= MAX_RETRIES) {
          await this.removeFromQueue(item.audioUri);
          continue;
        }

        // Try to process the audio file
        const { supabaseUrl } = await storage.getSupabaseConfig();
        const { accessToken } = await storage.getAuthData();

        const formData = new FormData();
        formData.append('audio', {
          uri: item.audioUri,
          type: 'audio/m4a',
          name: 'recording.m4a',
        });

        const response = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        });

        const { transcription } = await response.json();
        
        if (transcription) {
          const textWithLabel = `${transcription} (voice)`;
          onTranscriptionComplete(textWithLabel);
          await this.removeFromQueue(item.audioUri);
        } else {
          throw new Error('No transcription received');
        }
      } catch (error) {
        console.error('Failed to process queued item:', error);
        
        // Update retry count
        item.retries++;
        await storage.setItem(QUEUE_KEY, JSON.stringify(queue));
        
        // Wait before trying next item
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  },
}; 