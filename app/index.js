import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { storage } from './utils/storage';

export default function StartScreen() {
  const router = useRouter();

  useEffect(() => {
    Promise.resolve(
      storage.getItem('onboardingComplete')
    ).then((value) => {
      if (value === 'true') {
        router.replace('/tabs/today');
      } else {
        router.replace('/onboarding1');
      }
    });
  }, []);

  return null;
}