import 'react-native-get-random-values';
import React from 'react';
import moment from 'moment-timezone';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MenuProvider } from 'react-native-popup-menu';

// Default to the device's local timezone so all date math is correct across locales
const deviceTimezone = moment.tz.guess();
moment.tz.setDefault(deviceTimezone);

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
}

function ErrorScreen({ message }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
      <Text style={{ fontSize: 16, color: '#ff0000', textAlign: 'center', marginHorizontal: 20 }}>
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

  useEffect(() => {
    async function prepare() {
      try {
        setInitializing(false);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error('Error during initialization:', e);
        setInitializing(false);
        await SplashScreen.hideAsync();
      }
    }

    if (fontsLoaded) {
      prepare();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <LoadingScreen />;
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
              name="settings"
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                animation: 'none',
              }}
            />
            <Stack.Screen
              name="timePicker"
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                animation: 'none',
              }}
            />
          </Stack>
        </MenuProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}