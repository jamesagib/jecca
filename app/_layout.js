import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';
import { syncReminders } from './utils/sync';
import { registerForPushNotifications } from './utils/notifications';

SplashScreen.preventAutoHideAsync();

function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="onboarding1" />
      <Stack.Screen name="onboarding2" />
      <Stack.Screen name="onboarding3" />
      <Stack.Screen name="email-auth" />
    </Stack>
  );
}

function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="index" />
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
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
  });
  const [initializing, setInitializing] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const { initialize, user } = useAuthStore();

  useEffect(() => {
    if (!fontsLoaded) return;

    async function prepare() {
      try {
        // Initialize auth state first
        await initialize();
        
        // Check onboarding status
        const onboardingStatus = await storage.getItem('onboardingComplete');
        const hasCompletedOnboarding = onboardingStatus === 'true';
        
        // If user exists but onboarding not marked complete, mark it complete
        if (user && !hasCompletedOnboarding) {
          await storage.setItem('onboardingComplete', 'true');
          setIsOnboardingComplete(true);
        } else {
          setIsOnboardingComplete(hasCompletedOnboarding);
        }

        // Register for push notifications if user is logged in
        if (user) {
          await registerForPushNotifications();
          await syncReminders();
        }

        setInitializing(false);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error('Error during initialization:', e);
        setIsOnboardingComplete(false);
        setInitializing(false);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [fontsLoaded, user]);

  if (!fontsLoaded || initializing) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {isOnboardingComplete ? <MainLayout /> : <OnboardingLayout />}
    </GestureHandlerRootView>
  );
}
