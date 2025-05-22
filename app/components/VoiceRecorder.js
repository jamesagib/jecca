import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { storage } from '../utils/storage';
import NetInfo from '@react-native-community/netinfo';
import { offlineQueue } from '../utils/offlineQueue';
import { usageLimit } from '../utils/usageLimit';
import { transcriptionCache } from '../utils/transcriptionCache';
import WaveformVisualizer from './WaveformVisualizer';

const MAX_RECORDING_TIME = 30; // seconds
const RECORDING_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 32000,
    meteringEnabled: true,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 32000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
    meteringEnabled: true,
  },
};

export default function VoiceRecorder({ onRecordingComplete }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [remainingRecordings, setRemainingRecordings] = useState(null);
  const [amplitude, setAmplitude] = useState(0);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((time) => {
          if (time >= MAX_RECORDING_TIME) {
            stopRecording();
            return 0;
          }
          return time + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Add useEffect to check remaining recordings
  useEffect(() => {
    const checkRemainingRecordings = async () => {
      const remaining = await usageLimit.getRemainingCount();
      setRemainingRecordings(remaining);
    };
    
    checkRemainingRecordings();
  }, []);

  // Add metering interval
  useEffect(() => {
    let meterInterval;
    if (isRecording && recording) {
      meterInterval = setInterval(async () => {
        try {
          const status = await recording.getStatusAsync();
          if (status.isRecording) {
            const { metering = 0 } = status;
            // Normalize metering value (usually between -160 and 0) to 0-1
            const normalizedAmplitude = (metering + 160) / 160;
            setAmplitude(normalizedAmplitude);
          }
        } catch (error) {
          console.error('Error getting recording status:', error);
        }
      }, 100); // Update every 100ms
    }
    return () => {
      if (meterInterval) clearInterval(meterInterval);
    };
  }, [isRecording, recording]);

  const getPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Microphone permission is required.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      // Check if user can record
      const canRecord = await usageLimit.canRecord();
      if (!canRecord) {
        alert('You have reached your monthly recording limit. Please try again next month.');
        return;
      }

      const permission = await getPermission();
      if (!permission) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);

      // Increment usage after successful recording start
      await usageLimit.incrementUsage();
      const remaining = await usageLimit.getRemainingCount();
      setRemainingRecordings(remaining);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setRecording(recording);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Failed to start recording', err);
      alert('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const uri = recording.getURI();
      if (uri) {
        setIsProcessing(true);
        await processAudioFile(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      alert('Failed to stop recording. Please try again.');
    } finally {
      setRecording(null);
      setRecordingTime(0);
    }
  };

  const processAudioFile = async (audioUri) => {
    try {
      // Check network connectivity
      const networkState = await NetInfo.fetch();
      
      if (!networkState.isConnected) {
        // Save to offline queue
        await offlineQueue.addToQueue(audioUri);
        alert('You are offline. Your recording will be processed when you are back online.');
        return;
      }

      // Check authentication
      const authData = await storage.getAuthData();
      if (!authData || !authData.accessToken) {
        alert('Please sign in to use voice recording features.');
        return;
      }

      // Create FormData for audio file
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });

      const { supabaseUrl } = await storage.getSupabaseConfig();
      
      // Send to Supabase Edge Function for transcription
      const response = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { transcription } = await response.json();
      
      if (transcription) {
        // Check cache for similar transcriptions
        const cachedCleanText = await transcriptionCache.findMatch(transcription);
        
        let cleanedText;
        if (cachedCleanText) {
          cleanedText = cachedCleanText;
        } else {
          // Clean text with GPT if no cache match
          const cleanResponse = await fetch(`${supabaseUrl}/functions/v1/clean-reminder`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authData.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: transcription }),
          });

          if (!cleanResponse.ok) {
            throw new Error(`Failed to clean text: ${cleanResponse.status}`);
          }

          const { cleanedText: gptCleanedText } = await cleanResponse.json();
          cleanedText = gptCleanedText;
          
          // Add to cache
          await transcriptionCache.addToCache(transcription, cleanedText);
        }

        const textWithLabel = `${cleanedText} (voice)`;
        onRecordingComplete(textWithLabel);
      } else {
        throw new Error('No transcription received');
      }
    } catch (error) {
      console.error('Transcription failed:', error);
      
      if (!storage.getAuthData()) {
        alert('Please sign in to use voice recording features.');
      } else {
        // Save to offline queue on error
        await offlineQueue.addToQueue(audioUri);
        alert('Failed to process recording. It will be retried when possible.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Add useEffect for processing offline queue
  useEffect(() => {
    const processOfflineQueue = async () => {
      await offlineQueue.processQueue(onRecordingComplete);
    };

    // Process queue on mount and when network status changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        processOfflineQueue();
      }
    });

    // Initial process
    processOfflineQueue();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      {remainingRecordings !== null && remainingRecordings < 10 && (
        <Text style={[styles.remainingText, { color: '#000000' }]}>
          {remainingRecordings} recordings remaining this month
        </Text>
      )}

      {isRecording && (
        <Animated.View 
          entering={FadeInUp.duration(200)}
          style={styles.recordingIndicator}
        >
          <Text style={[styles.recordingText, { color: '#000000' }]}>
            Recording... {recordingTime}s
          </Text>
          <View style={[styles.pulsingDot, { backgroundColor: '#000000' }]} />
        </Animated.View>
      )}

      <WaveformVisualizer 
        isRecording={isRecording}
        amplitude={amplitude}
      />

      {isProcessing && (
        <Animated.View 
          entering={FadeInUp.duration(200)}
          style={styles.processingIndicator}
        >
          <ActivityIndicator color="#000000" />
          <Text style={[styles.processingText, { color: '#000000' }]}>
            Transcribing...
          </Text>
        </Animated.View>
      )}

      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordingButton,
          { backgroundColor: isRecording ? '#FF0000' : '#000000' }
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
      >
        <Feather 
          name="mic" 
          size={24} 
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 15 : 30, // 30px above the tab bar
    left: 0,
    right: 0,
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#CFCFCF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingButton: {
    transform: [{ scale: 1.1 }],
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingText: {
    marginRight: 10,
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  processingText: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  },
  remainingText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Nunito_800ExtraBold',
  },
}); 