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
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_800ExtraBold,
  });
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const initializeAuth = useAuthStore(state => state.initialize);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize auth state with retry
        let retryCount = 0;
        while (retryCount < 3) {
          try {
            await initializeAuth();
            break;
          } catch (error) {
            retryCount++;
            if (retryCount < 3) await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Check if onboarding is complete
        const onboardingComplete = await storage.getItem('onboardingComplete');
        setIsOnboardingComplete(onboardingComplete === 'true');
        
        // Initialize other features
        await Promise.all([
          registerForPushNotifications().catch(() => {}),
          syncReminders().catch(() => {})
        ]);
      } catch (e) {
        setError('An error occurred during initialization');
      } finally {
        setInitializing(false);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }

    if (fontsLoaded || fontError) {
      prepare();
    }
  }, [fontsLoaded, fontError, initializeAuth]);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#000000', textAlign: 'center' }}>
          {error}
        </Text>
      </View>
    );
  }

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
    );
  }

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!isOnboardingComplete ? (
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none'
          }}
        >
          <Stack.Screen name="onboarding1" />
          <Stack.Screen name="onboarding2" />
          <Stack.Screen name="onboarding3" />
          <Stack.Screen name="email-auth" />
        </Stack>
      ) :
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
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
              }
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
              }
            }}
          />
        </Stack>
      }
    </GestureHandlerRootView>
  );
}
