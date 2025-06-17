import 'text-encoding'; // Polyfill for TextEncoder
import React from 'react';
import { Stack } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';
import { syncReminders } from './utils/sync';
import { registerForPushNotifications } from './utils/notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MenuProvider } from 'react-native-popup-menu';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

// Initialize error handling
const LLErrorUtils = global.ErrorUtils;

if (LLErrorUtils) {
  LLErrorUtils.setGlobalHandler(async (error, isFatal) => {
    console.error('Global error:', error, 'Is fatal:', isFatal);
  });
} else {
  console.warn('global.ErrorUtils was not available at init time. Global error handler not set.');
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
}

function ErrorScreen({ message }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20 }}>
      <Text style={{ fontSize: 18, color: '#000000', textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_800ExtraBold,
  });
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const { initialize } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        await initialize();
        setInitializing(false);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error('Error during initialization:', e);
        setError(e.message);
        setInitializing(false);
        await SplashScreen.hideAsync();
      }
    }

    if (fontsLoaded) {
      prepare();
    }
  }, [fontsLoaded, initialize]);

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <MenuProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="home"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </MenuProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}