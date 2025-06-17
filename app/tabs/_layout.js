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
        },
        presentation: 'transparentModal'
      }}
    >
      <Tabs.Screen 
        name="today" 
        options={{
          headerShown: false,
          animation: 'none'
        }}
      />
      <Tabs.Screen 
        name="tomorrow" 
        options={{
          headerShown: false,
          animation: 'none'
        }}
      />
    </Tabs>
  );
});
