import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useZephyrStore } from '../store/useZephyrStore';

export default function RootLayout() {
  const requestLocation = useZephyrStore((s) => s.requestLocation);

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#030712' }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#030712' } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
