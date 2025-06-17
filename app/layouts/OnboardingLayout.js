import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';

const OnboardingLayout = () => {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    </View>
  );
};

export default OnboardingLayout; 