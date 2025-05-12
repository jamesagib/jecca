import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import * as SecureStore from 'expo-secure-store';
import { Redirect } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
  });
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    if (!fontsLoaded) return;

    SecureStore.getItemAsync('onboardingComplete')
      .then(status => {
        setInitialRoute(status === 'true' ? '/tabs/today' : '/onboarding1');
        SplashScreen.hideAsync();
      })
      .catch(() => {
        setInitialRoute('/onboarding1');
        SplashScreen.hideAsync();
      });
  }, [fontsLoaded]);

  if (!fontsLoaded || !initialRoute) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="tabs" />
      <Stack.Screen
        name="settings"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="timePicker"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: false,
        }}
      />
      <Stack.Screen name="onboarding1" />
      <Stack.Screen name="onboarding2" />
      <Stack.Screen name="onboarding3" />
      {initialRoute && <Redirect href={initialRoute} />}
    </Stack>
  );
}
