import { Stack } from 'expo-router';
import React from 'react';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AuthLayout() {
  const backgroundColor = useThemeColor({}, 'background'); // Use existing background color

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: backgroundColor as string } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}