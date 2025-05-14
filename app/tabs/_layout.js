import { Tabs } from 'expo-router';
import { memo } from 'react';
import { View, Platform } from 'react-native';

export default memo(function TabsLayout() {
  return (
    <View style={{ 
      flex: 1, 
      maxWidth: Platform.OS === 'web' ? 800 : '100%',
      width: '100%',
      alignSelf: 'center'
    }}>
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
    </View>
  );
});
