import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    const prepare = async () => {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Promise.all([
          // Add any other initialization logic here
        ]);
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        if (fontsLoaded) {
          await SplashScreen.hideAsync();
        }
      }
    };

    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{
        headerShown: false,
        animation: 'fade'
      }}>
      <Stack.Screen name="(tabs)" options={{ 
        headerShown: false,
        animation: 'none'
      }} />
      <Stack.Screen
        name="settings"
        options={{
          presentation: 'modal',
          gestureDirection: 'vertical',
          animation: "slide_from_bottom", 
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="timePicker"
        options={{
          presentation: 'modal',
          gestureDirection: 'vertical',
          animation: "slide_from_bottom", 
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
      <Stack.Screen name="onboarding1" options={{ 
        headerShown: false,
        animation: 'none'
      }} />
      <Stack.Screen name="onboarding2" options={{ 
        headerShown: false,
        animation: 'none'
      }} />
      <Stack.Screen name="onboarding3" options={{ 
        headerShown: false,
        animation: 'none'
      }} />
    </Stack>
  );
}
