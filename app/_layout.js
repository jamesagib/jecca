import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View, useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';
import { syncReminders } from './utils/sync';
import { registerForPushNotifications } from './utils/notifications';
import { useThemeStore } from './utils/theme';

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
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: false,
          contentStyle: {
            backgroundColor: 'transparent',
          }
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
  const { initialize: initializeAuth, user } = useAuthStore();
  const { initialize: initializeTheme } = useThemeStore();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!fontsLoaded) return;

    async function prepare() {
      try {
        console.log('Starting app initialization...');
        
        await initializeAuth();
        console.log('Auth initialized');
        
        const onboardingStatus = await storage.getItem('onboardingComplete');
        const hasCompletedOnboarding = onboardingStatus === 'true';
        console.log('Onboarding status:', hasCompletedOnboarding);
        
        setIsOnboardingComplete(hasCompletedOnboarding);

        if (user) {
          try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await registerForPushNotifications();
            console.log('Push notifications registered successfully');
          } catch (error) {
            console.warn('Failed to register push notifications:', error);
          }
          
          await syncReminders();
          console.log('Reminders synced');
        }

        console.log('Initialization complete');
        setInitializing(false);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error('Error during initialization:', e);
        if (!user) {
          await storage.setItem('onboardingComplete', 'false');
          setIsOnboardingComplete(false);
        }
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
      {!user && isOnboardingComplete ? (
        <OnboardingLayout />
      ) : (
        <MainLayout />
      )}
    </GestureHandlerRootView>
  );
}
