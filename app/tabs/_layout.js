import { Tabs } from 'expo-router';
import { memo } from 'react';
import { Platform } from 'react-native';

export default memo(function TabsLayout() {
  return (
    <Tabs 
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          display: 'none'
        },
        animation: 'none',
        contentStyle: {
          backgroundColor: '#FFFFFF'
        }
      }}
    >
      <Tabs.Screen 
        name="today" 
        options={{
          headerShown: false
        }}
      />
      <Tabs.Screen 
        name="tomorrow" 
        options={{
          headerShown: false
        }}
      />
    </Tabs>
  );
});
