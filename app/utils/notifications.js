import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { savePushToken, deletePushToken, scheduleReminder } from './supabaseApi';
import { useAuthStore } from './auth';

// Configure notifications to show when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  let token;

  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return null;
  }

  try {
    // Check if device is a real device
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    // Check if we have permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If we don't have permission, ask for it
    if (existingStatus !== 'granted') {
      console.log('Requesting push notification permission...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get the project ID from app config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error('Project ID not found in app config');
      return null;
    }

    console.log('Getting push token with project ID:', projectId);
    
    // Get the token with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const response = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        token = response.data;
        break;
      } catch (error) {
        console.warn(`Attempt ${retryCount + 1} failed to get push token:`, error);
        retryCount++;
        if (retryCount === maxRetries) {
          throw error;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // Store the token in Supabase if user is logged in
    const { user, accessToken } = useAuthStore.getState();
    if (user && accessToken && token) {
      console.log('Saving push token to Supabase...');
      await savePushToken(
        user.id,
        token,
        Device.modelName || 'unknown',
        accessToken
      );
    }

    // Platform-specific setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export async function unregisterPushNotifications() {
  try {
    const { user, accessToken } = useAuthStore.getState();
    if (!user || !accessToken) return;

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID,
    })).data;

    await deletePushToken(user.id, token, accessToken);
  } catch (error) {
    console.error('Error unregistering push notifications:', error);
  }
}

export async function scheduleNotificationWithSupabase(reminder) {
  try {
    const { user, accessToken } = useAuthStore.getState();
    if (!user || !accessToken) return null;

    const { data, error } = await scheduleReminder(
      reminder.id,
      user.id,
      accessToken
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error scheduling notification with Supabase:', error);
    return null;
  }
} 