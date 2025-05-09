// app/(tabs)/_layout.js
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';

export default function TabsLayout() {

  let [fontsLoaded] = useFonts({
    Nunito_800ExtraBold, 
  });

  if (!fontsLoaded) return null;

  return (<Stack screenOptions={{ headerShown: false, animation: 'none' }} /> );
}
