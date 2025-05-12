import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import * as SecureStore from 'expo-secure-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
  });
  const [initializing, setInitializing] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    if (!fontsLoaded) return;

    async function prepare() {
      try {
        const status = await SecureStore.getItemAsync('onboardingComplete');
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
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {!isOnboardingComplete ? (
          <>
            <Stack.Screen name="onboarding1" options={{ headerShown: false,}} />
            <Stack.Screen name="onboarding2" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding3" options={{ headerShown: false }} />
          </>
        ) : (
          <>
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
          </>
        )}
      </Stack>
    </View>
  );
}
