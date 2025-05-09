// app/(tabs)/_layout.js
import { Tabs, useRouter, useSegments } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { usePathname } from 'expo-router';
import { useFonts } from 'expo-font';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';

export default function TabsLayout() {
  const pathname = usePathname();

  let [fontsLoaded] = useFonts({
    Nunito_800ExtraBold, 
  });

  if (!fontsLoaded) return null;

  const tabs = [
    { name: 'today', route: '/today' },
    { name: 'tmrw', route: '/tmrw' },
  ];

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={() => (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: '#F2F2F2',
            backgroundColor: 'white',
          }}
        >
          {tabs.map((tab) => {
            const isFocused = pathname === tab.route;
            return (
              <Pressable
                key={tab.name}
                onPress={() => router.push(tab.route)}
              >
                <Text
                  style={{
                    fontFamily: isFocused ? 'Nunito_800ExtraBold' : 'Nunito_800ExtraBold',
                    fontSize: 18,
                    color: isFocused ? '#212121' : '#CFCFCF',
                    textTransform: 'lowercase',
                  }}
                >
                  {tab.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    />
  );
}
