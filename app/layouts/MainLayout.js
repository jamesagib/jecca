import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';

const MainLayout = () => {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </View>
  );
};

export default MainLayout; 