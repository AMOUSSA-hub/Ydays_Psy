import React from 'react';
import { View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/app/components/ui/button';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function OnboardingScreen() {
  const lightBluePurple = '#A0B0FF'; // Custom color from image
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ThemedView className="flex-1 relative">
      {/* Top empty space */}
      <View className="flex-1 bg-white" />

      {/* Bottom curved section */}
      <View
        className="absolute bottom-0 left-0 right-0 h-1/2 rounded-t-[999px] overflow-hidden items-center justify-center"
        style={{ backgroundColor: lightBluePurple }}
      >
        <Button onPress={() => router.replace('/(tabs)/home')} variant="white" className="w-48">
          Commencer
        </Button>
      </View>
    </ThemedView>
  );
}