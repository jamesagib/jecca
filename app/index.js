import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';

export default function StartScreen() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    async function checkInitialRoute() {
      try {
        // Wait for auth to be initialized
        if (!initialized) return;

        const onboardingComplete = await storage.getItem('onboardingComplete');
        
        // If user is logged in, go to today's tasks
        if (user) {
          router.replace('/tabs/today');
          return;
        }
        
        // If onboarding is complete but no user, reset onboarding
        if (onboardingComplete === 'true' && !user) {
          await storage.setItem('onboardingComplete', 'false');
          router.replace('/onboarding1');
        } else if (onboardingComplete === 'true') {
          router.replace('/tabs/today');
        } else {
          router.replace('/onboarding1');
        }
      } catch (error) {
        console.error('Error checking initial route:', error);
        await storage.setItem('onboardingComplete', 'false');
        router.replace('/onboarding1');
      }
    }

    checkInitialRoute();
  }, [user, initialized]);

  return null;
}