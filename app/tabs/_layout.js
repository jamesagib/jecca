import { Tabs } from 'expo-router';
import { memo } from 'react';

export default memo(function TabsLayout() {
  return (
    <Tabs 
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        animation: 'none'
      }}
    >
      <Tabs.Screen name="today" />
      <Tabs.Screen name="tomorrow" />
    </Tabs>
  );
});
