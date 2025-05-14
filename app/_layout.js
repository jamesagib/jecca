import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { storage } from './utils/storage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
  });
  const [initializing, setInitializing] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    async function prepare() {
      if (!fontsLoaded) return;
      try {
        const status = await storage.getItem('onboardingComplete');
        setIsOnboardingComplete(status === 'true');
      } catch (e) {
        setIsOnboardingComplete(false);
      } finally {
        setInitializing(false);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded || initializing) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' }
        }}
      >
        {!isOnboardingComplete ? (
          <>
            <Stack.Screen name="onboarding1" />
            <Stack.Screen name="onboarding2" />
            <Stack.Screen name="onboarding3" />
          </>
        ) : (
          <>
            <Stack.Screen name="tabs" />
            <Stack.Screen
              name="settings"
              options={{
                presentation: 'transparentModal',
                animation: Platform.OS === 'ios' ? 'fade' : 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="timePicker"
              options={{
                presentation: 'transparentModal',
                animation: Platform.OS === 'ios' ? 'fade' : 'slide_from_bottom',
              }}
            />
          </>
        )}
      </Stack>
    </GestureHandlerRootView>
  );
}
