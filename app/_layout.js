import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{
        // Hide the header for all other routes.
        headerShown: false,
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings"
        options={{
          presentation: 'modal',
          gestureDirection: 'vertical',
          animation: "slide_from_bottom", 
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="timePicker"
        options={{
          presentation: 'modal',
          gestureDirection: 'vertical',
          animation: "slide_from_bottom", 
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
    </Stack>
  );
}
