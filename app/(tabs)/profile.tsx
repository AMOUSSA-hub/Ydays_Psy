import React from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Button } from '@/src/components/ui/button';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const backgroundColor = useThemeColor({}, 'background');

  const handleLogout = () => {
    // Simulate logout
    alert('Logged out!');
    router.replace('/login'); // Redirect to login page
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E0BBE4', dark: '#4A2C5B' }}
      headerImage={
        <IconSymbol
          size={150}
          color="#fff"
          name="person.fill"
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
        />
      }>
      <ThemedView className="flex-1 items-center justify-center p-6 bg-[${backgroundColor}]">
        <ThemedText type="title" className="mb-4">Profile</ThemedText>
        <ThemedText className="text-lg mb-2">Welcome, User!</ThemedText>
        <ThemedText className="text-base text-gray-500 mb-8">user@example.com</ThemedText>
        <Button onPress={handleLogout} variant="secondary" className="w-full max-w-xs">
          Logout
        </Button>
      </ThemedView>
    </ParallaxScrollView>
  );
}