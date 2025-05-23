import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';
import { View } from 'react-native';

export default function StartScreen() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    async function checkInitialRoute() {
      try {
        console.log('Checking initial route. Auth initialized:', initialized);
        
        // Wait for auth to be initialized
        if (!initialized) {
          console.log('Auth not yet initialized, waiting...');
          return;
        }

        let onboardingComplete = false;
        try {
          const status = await storage.getItem('onboardingComplete');
          onboardingComplete = status === 'true';
          console.log('Onboarding status:', { status, onboardingComplete });
        } catch (storageError) {
          console.warn('Error reading onboarding status:', storageError);
          // Continue with default false value
        }
        
        const targetRoute = onboardingComplete ? '/tabs/today' : '/onboarding1';
        console.log('Navigating to:', targetRoute);
        
        try {
          await router.replace(targetRoute);
        } catch (navigationError) {
          console.error('Navigation failed:', navigationError);
          // If navigation fails, try one more time after a short delay
          setTimeout(() => {
            router.replace(targetRoute).catch(error => {
              console.error('Retry navigation failed:', error);
            });
          }, 100);
        }
      } catch (error) {
        console.error('Fatal error in checkInitialRoute:', error);
        // In case of a fatal error, try to reset to onboarding
        try {
          await storage.setItem('onboardingComplete', 'false');
          router.replace('/onboarding1');
        } catch (fallbackError) {
          console.error('Even fallback navigation failed:', fallbackError);
        }
      }
    }

    checkInitialRoute();
  }, [user, initialized, router]);

  // Show a loading state instead of null
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
  );
}