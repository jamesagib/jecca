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

  const prepare = useCallback(async () => {
    try {
      // Initialize auth state
      await initializeAuth();
      
      // Check if onboarding is complete
      const onboardingComplete = await storage.getItem('onboardingComplete');
      setIsOnboardingComplete(onboardingComplete === 'true');
      
      // Register for push notifications if needed
      await registerForPushNotifications();
      
      // Sync reminders
      await syncReminders();
      
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
            headerShown: false,
            contentStyle: {
              backgroundColor: 'transparent'
            },
            cardStyle: { backgroundColor: 'transparent' }
          }}
        >
          <Stack.Screen 
            name="tabs"
            options={{
              presentation: 'card',
              contentStyle: {
                backgroundColor: '#FFFFFF'
              }
            }}
          />
          <Stack.Screen 
            name="settings"
            options={{
              presentation: 'transparentModal',
              animation: 'none',
              contentStyle: {
                backgroundColor: 'transparent'
              },
              cardStyle: {
                backgroundColor: 'transparent'
              },
              cardStyleInterpolator: ({ current: { progress } }) => ({
                cardStyle: {
                  opacity: progress,
                  transform: [
                    {
                      translateY: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [800, 0],
                      }),
                    },
                  ],
                },
                overlayStyle: {
                  opacity: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5],
                  }),
                },
              }),
            }}
          />
          <Stack.Screen 
            name="timePicker"
            options={{
              presentation: 'transparentModal',
              animation: 'none',
              contentStyle: {
                backgroundColor: 'transparent'
              },
              cardStyle: {
                backgroundColor: 'transparent'
              },
              cardStyleInterpolator: ({ current: { progress } }) => ({
                cardStyle: {
                  opacity: progress,
                  transform: [
                    {
                      translateY: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [800, 0],
                      }),
                    },
                  ],
                },
                overlayStyle: {
                  opacity: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5],
                  }),
                },
              }),
            }}
          />
        </Stack>
      )}
    </GestureHandlerRootView>
  );
}
