import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuthStore } from './utils/auth';
import { storage } from './utils/storage';

export default function Index() {
  const { user, initialized } = useAuthStore();
  const [onboardingComplete, setOnboardingComplete] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const status = await storage.getItem('onboardingComplete');
      setOnboardingComplete(status === 'true');
    };
    checkOnboardingStatus();
  }, []);

  if (!initialized || onboardingComplete === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (user || onboardingComplete) {
    return <Redirect href="/tabs/today" />;
  }

  return <Redirect href="/onboarding1" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});