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
        sceneContainerStyle: {
          flex: 1, 
          maxWidth: Platform.OS === 'web' ? '100%' : '100%',
          width: '100%',
          alignSelf: 'center',
          backgroundColor: '#fff'
        }
      }}
    >
      <Tabs.Screen name="today" />
      <Tabs.Screen name="tomorrow" />
    </Tabs>
  );
});
