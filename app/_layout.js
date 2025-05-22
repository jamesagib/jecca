import { Stack } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Platform, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';
import { syncReminders } from './utils/sync';
import { registerForPushNotifications } from './utils/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
  });
  const [initializing, setInitializing] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const initializeAuth = useAuthStore(state => state.initialize);
  const user = useAuthStore(state => state.user);

  const prepare = useCallback(async () => {
    try {
      console.log('Starting app initialization...');
      
      // Initialize auth first and wait for it to complete
      await initializeAuth();
      console.log('Auth initialized');
      
      // Only proceed if auth initialization is complete
      if (!useAuthStore.getState().initialized) {
        console.error('Auth initialization failed');
        throw new Error('Auth initialization failed');
      }

      const onboardingStatus = await storage.getItem('onboardingComplete');
      const hasCompletedOnboarding = onboardingStatus === 'true';
      console.log('Onboarding status:', hasCompletedOnboarding);
      
      setIsOnboardingComplete(hasCompletedOnboarding);

      // Get the current auth state after initialization
      const currentUser = useAuthStore.getState().user;
      
      if (currentUser) {
        try {
          // Add a small delay to ensure auth state is stable
          await new Promise(resolve => setTimeout(resolve, 1000));
          await registerForPushNotifications();
          console.log('Push notifications registered successfully');
        } catch (error) {
          console.warn('Failed to register push notifications:', error);
        }
        
        await syncReminders();
        console.log('Reminders synced');
      }

      console.log('Initialization complete');
      setInitializing(false);
      await SplashScreen.hideAsync();
    } catch (e) {
      console.error('Error during initialization:', e);
      // If auth failed or user is not authenticated, reset onboarding
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        await storage.setItem('onboardingComplete', 'false');
        setIsOnboardingComplete(false);
      }
      setInitializing(false);
      await SplashScreen.hideAsync();
    }
  }, [initializeAuth]);

  useEffect(() => {
    if (fontsLoaded) {
      prepare();
    }
  }, [fontsLoaded, prepare]);

  if (!fontsLoaded || initializing) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!isOnboardingComplete ? (
        <Stack
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name="onboarding1" />
          <Stack.Screen name="onboarding2" />
          <Stack.Screen name="onboarding3" />
          <Stack.Screen name="email-auth" />
        </Stack>
      ) : (
        <Stack
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name="tabs" />
          <Stack.Screen 
            name="settings"
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="timePicker"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              animationDuration: 200,
            }}
          />
        </Stack>
      )}
    </GestureHandlerRootView>
  );
}
