import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuthStore } from './utils/auth';

export default function Index() {
  const { user, initialized } = useAuthStore();
  const router = useRouter();

  if (!initialized) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // If user is authenticated, redirect to home
  if (user) {
    return <Redirect href="/home" />;
  }

  // If not authenticated, redirect to onboarding
  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});