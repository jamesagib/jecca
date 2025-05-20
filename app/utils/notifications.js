import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
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
    return null;
  }

  try {
    // Check if we have permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If we don't have permission, ask for it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Get the token
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID,
    })).data;

    // Store the token in Supabase if user is logged in
    const { user, accessToken } = useAuthStore.getState();
    if (user && accessToken) {
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