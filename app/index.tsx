import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/app/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function WelcomeScreen() {
  const lightPurple = '#E0E0FF'; // Custom color from image
  const darkPurpleBlue = '#A0B0FF'; // Custom color from image
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ThemedView className="flex-1 relative">
      {/* Top curved section */}
      <View
        className="absolute top-0 left-0 right-0 h-1/2 rounded-b-[999px] overflow-hidden"
        style={{ backgroundColor: lightPurple }}
      >
        <ThemedText type="title" className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          Bienvenue !
        </ThemedText>
      </View>

      {/* Content below the curve */}
      <View className="flex-1 justify-center items-center mt-[50%] p-6">
        <View className="w-full max-w-xs space-y-4">
          <Button onPress={() => router.push('/(auth)/login')} className="w-full">
            Se connecter
          </Button>
          <Button onPress={() => router.push('/(auth)/register')} className="w-full">
            S'inscrire
          </Button>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/onboarding')}
          className="mt-8 w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: darkPurpleBlue }}
        >
          <IconSymbol name="arrow.right" size={32} color="white" />
        </TouchableOpacity>
      </View>

      {/* Question mark at the bottom */}
      <View className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <IconSymbol name="questionmark.circle.fill" size={24} color={useThemeColor({}, 'icon')} />
      </View>
    </ThemedView>
  );
}