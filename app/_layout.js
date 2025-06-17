import { Stack } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Platform, View } from 'react-native';
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
  const [hasPrepared, setHasPrepared] = useState(false);
  const { initialize, user } = useAuthStore();

  const prepareApp = useCallback(async () => {
    if (hasPrepared) {
      console.log('App already prepared, skipping...');
      return;
    }

    try {
      console.log('Starting app preparation...');
      
      // Check onboarding status first
      const onboardingStatus = await storage.getItem('onboardingComplete');
      const hasCompletedOnboarding = onboardingStatus === 'true';
      
      console.log('Onboarding status:', {
        onboardingStatus,
        hasCompletedOnboarding
      });
      
      // Always initialize auth, but handle the state properly
      await initialize();
      
      console.log('Auth initialization complete, user:', !!user);
      
      if (user) {
        // If user exists but onboarding not marked complete, mark it complete
        if (!hasCompletedOnboarding) {
          await storage.setItem('onboardingComplete', 'true');
          setIsOnboardingComplete(true);
        } else {
          setIsOnboardingComplete(true);
        }

        // Register for push notifications if user is logged in
        await Promise.all([
          registerForPushNotifications(),
          syncReminders()
        ]);
      } else {
        // If no user, check if onboarding is complete
        setIsOnboardingComplete(hasCompletedOnboarding);
      }

      console.log('Final onboarding state:', {
        isOnboardingComplete: hasCompletedOnboarding,
        user: !!user
      });

      setHasPrepared(true);
      setInitializing(false);
      await SplashScreen.hideAsync();
    } catch (e) {
      console.error('Error during initialization:', e);
      // On error, reset to onboarding
      await storage.setItem('onboardingComplete', 'false');
      setIsOnboardingComplete(false);
      setHasPrepared(true);
      setInitializing(false);
      await SplashScreen.hideAsync();
    }
  }, [initialize, hasPrepared]);

  useEffect(() => {
    if (fontsLoaded && !hasPrepared) {
      prepareApp();
    }
  }, [fontsLoaded, hasPrepared, prepareApp]);

  if (!fontsLoaded || initializing) {
    return null;
  }

  // Determine which layout to show - only check onboarding status
  const showOnboarding = !isOnboardingComplete;
  
  console.log('Layout decision:', {
    showOnboarding,
    isOnboardingComplete,
    user: !!user
  });
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {showOnboarding ? <OnboardingLayout /> : <MainLayout />}
      </View>
    </GestureHandlerRootView>
  );
}
