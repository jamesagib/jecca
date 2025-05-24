import 'text-encoding'; // Polyfill for TextEncoder
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
import { PostHogProvider } from 'posthog-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { MenuProvider } from 'react-native-popup-menu';
import './utils/textEncoderPolyfill'; // Import the polyfill
import { AuthProvider } from './utils/auth'; // Import the AuthProvider and useAuthStore hook

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

// Initialize error handling
const LLErrorUtils = global.ErrorUtils;

if (LLErrorUtils) {
  LLErrorUtils.setGlobalHandler(async (error, isFatal) => {
    console.error('Global error:', error, 'Is fatal:', isFatal);
    await trackError(error, { is_fatal: isFatal });
  
    // Also send to Sentry for detailed debugging
    // Sentry.captureException(error);
  });
} else {
  console.warn('global.ErrorUtils was not available at init time. Global error handler not set.');
}

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
        // Track app initialization start
        await trackAppInitialization();
        
        // Initialize auth state with retry
        let retryCount = 0;
        while (retryCount < 3) {
          try {
            await initializeAuth();
            break;
          } catch (error) {
            retryCount++;
            if (retryCount < 3) await new Promise(resolve => setTimeout(resolve, 1000));
            await trackError(error, { 
              context: 'auth_initialization',
              retry_count: retryCount 
            });
          }
        }
        
        // Check if onboarding is complete
        const onboardingComplete = await storage.getItem('onboardingComplete');
        setIsOnboardingComplete(onboardingComplete === 'true');
        
        // Initialize other features
        await Promise.all([
          registerForPushNotifications().catch(async (error) => {
            await trackError(error, { context: 'push_notifications' });
          }),
          syncReminders().catch(async (error) => {
            await trackError(error, { context: 'reminders_sync' });
          })
        ]);
      } catch (e) {
        setError('An error occurred during initialization');
        await trackError(e, { context: 'app_initialization' });
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
            cardStyle: { backgroundColor: 'transparent' },
            gestureEnabled: false,
            gestureDirection: 'horizontal'
          }}
        >
          <Stack.Screen 
            name="tabs"
            options={{
              presentation: 'card',
              contentStyle: {
                backgroundColor: '#FFFFFF'
              },
              gestureEnabled: false
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
              gestureEnabled: false
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
              gestureEnabled: false
            }}
          />
        </Stack>
      }
    </GestureHandlerRootView>
  );
}