import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';
import { View } from 'react-native';

export default function StartScreen() {
  const router = useRouter();
  const { initialized } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function navigate() {
      if (!mounted || !initialized) return;
      
      try {
        const onboardingComplete = await storage.getItem('onboardingComplete') === 'true';
        const targetRoute = onboardingComplete ? '/tabs/today' : '/onboarding1';
        await router.replace(targetRoute);
      } catch (error) {
        await storage.setItem('onboardingComplete', 'false');
        await router.replace('/onboarding1');
      }
    }

    navigate();
    return () => { mounted = false; };
  }, [initialized, router]);

  return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
}