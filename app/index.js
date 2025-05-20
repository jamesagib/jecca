import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';

export default function StartScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    async function checkInitialRoute() {
      try {
        const onboardingComplete = await storage.getItem('onboardingComplete');
        
        // If user is logged in, go to today's tasks
        if (user) {
          router.replace('/tabs/today');
          return;
        }
        
        // If onboarding is complete but no user, still show today's tasks
        // This allows using the app without being logged in
        if (onboardingComplete === 'true') {
          router.replace('/tabs/today');
        } else {
          router.replace('/onboarding1');
        }
      } catch (error) {
        console.error('Error checking initial route:', error);
        router.replace('/onboarding1');
      }
    }

    checkInitialRoute();
  }, [user]);

  return null;
}