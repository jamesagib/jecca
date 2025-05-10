// app/(tabs)/_layout.js
import { Stack } from 'expo-router';

export default function TabsLayout() {
  return <Stack screenOptions={{
    headerShown: false,
    animation: 'fade',
    presentation: 'transparentModal'
  }} />;
}
