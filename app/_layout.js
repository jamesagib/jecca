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
  const { initialize: initializeAuth, user } = useAuthStore();
  const { initialize: initializeTheme } = useThemeStore();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!fontsLoaded) return;

    async function prepare() {
      try {
        console.log('Starting app initialization...');
        
        // Initialize theme
        console.log('Initializing theme...');
        await initializeTheme();
        console.log('Theme initialized');

        // Initialize auth state
        console.log('Initializing auth...');
        await initializeAuth();
        console.log('Auth initialized');
        
        // Check onboarding status
        console.log('Checking onboarding status...');
        const onboardingStatus = await storage.getItem('onboardingComplete');
        const hasCompletedOnboarding = onboardingStatus === 'true';
        console.log('Onboarding status:', hasCompletedOnboarding);
        
        // Only update onboarding status if user exists and onboarding not complete
        if (user && !hasCompletedOnboarding) {
          console.log('User exists but onboarding not complete, marking complete...');
          await storage.setItem('onboardingComplete', 'true');
          setIsOnboardingComplete(true);
        } else {
          // Keep existing onboarding status
          setIsOnboardingComplete(hasCompletedOnboarding);
        }

        // Register for push notifications if user is logged in
        if (user) {
          console.log('User logged in, registering for push notifications...');
          try {
          await registerForPushNotifications();
            console.log('Push notifications registered');
          } catch (error) {
            console.warn('Failed to register push notifications:', error);
            // Continue even if push notifications fail
          }
          
          console.log('Syncing reminders...');
          await syncReminders();
          console.log('Reminders synced');
        }

        console.log('Initialization complete');
        setInitializing(false);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error('Error during initialization:', e);
        // Only reset onboarding if there's a critical error
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
        <View style={{ flex: 1 }}>
          <OnboardingLayout />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {isOnboardingComplete ? <MainLayout /> : <OnboardingLayout />}
        </View>
      )}
    </GestureHandlerRootView>
  );
}
