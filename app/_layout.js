import { Stack } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Platform, View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';
import { syncReminders } from './utils/sync';
import { registerForPushNotifications } from './utils/notifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  // Preventing splash screen from auto-hiding might fail in Expo Go
  console.warn('Error preventing splash screen auto-hide');
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_800ExtraBold,
  });
  const [initializing, setInitializing] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const initializeAuth = useAuthStore(state => state.initialize);

  const prepare = useCallback(async () => {
    try {
      console.log('Starting app initialization');
      
      // Initialize auth state
      await initializeAuth().catch(error => {
        console.warn('Auth initialization error:', error);
        // Continue even if auth fails
      });
      
      // Check if onboarding is complete
      try {
        const onboardingComplete = await storage.getItem('onboardingComplete');
        setIsOnboardingComplete(onboardingComplete === 'true');
      } catch (error) {
        console.warn('Error checking onboarding status:', error);
        // Default to showing onboarding if we can't check status
        setIsOnboardingComplete(false);
      }
      
      // Register for push notifications if needed
      await registerForPushNotifications().catch(error => {
        console.warn('Push notification registration error:', error);
        // Continue even if push registration fails
      });
      
      // Sync reminders
      await syncReminders().catch(error => {
        console.warn('Reminder sync error:', error);
        // Continue even if sync fails
      });
    } catch (e) {
      console.error('Error during initialization:', e);
    } finally {
      setInitializing(false);
      // Hide splash screen after everything is ready
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn('Error hiding splash screen:', error);
      }
    }
  }, [initializeAuth]);

  useEffect(() => {
    // Start initialization as soon as fonts are loaded or if there's a font error
    if (fontsLoaded || fontError) {
      prepare();
    }
  }, [fontsLoaded, fontError, prepare]);

  // Show a loading screen while fonts are loading
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#CFCFCF', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#000000' }}>Loading...</Text>
      </View>
    );
  }

  // Show a loading screen while initializing
  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#CFCFCF', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#000000' }}>Initializing...</Text>
      </View>
    );
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
