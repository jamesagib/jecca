import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(null);

  useEffect(() => {
    SecureStore.getItemAsync('onboardingComplete')
      .then(status => setIsOnboardingComplete(status === 'true'));
  }, []);

  if (isOnboardingComplete === null) {
    return <View />; // Loading state
  }

  return <Redirect href={isOnboardingComplete ? "/tabs/today" : "/onboarding1"} />;
}