import React from 'react';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/app/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-lavender-200">
      {/* Purple curved top section */}
      <View className="relative items-center" style={{ height: '45%' }}>
        {/* Background arc shape */}
        <View
          className="absolute bg-orchid"
          style={{
            width: width * 2,
            height: width * 2,
            borderRadius: width,
            top: -(width * 2) + (width * 0.85),
            left: -(width / 2),
          }}
        />
        {/* Title text positioned on the arc */}
        <View className="absolute bottom-16 items-center">
          <ThemedText
            className="text-white text-3xl font-bold"
            lightColor="#FFFFFF"
            darkColor="#FFFFFF"
          >
            Bienvenue !
          </ThemedText>
        </View>
      </View>

      {/* Buttons section */}
      <View className="flex-1 items-center justify-center px-10">
        <View className="w-full gap-4">
          <Button
            onPress={() => router.push('/(auth)/login')}
            className="w-full py-4"
            variant="primary"
          >
            Se connecter
          </Button>
          <Button
            onPress={() => router.push('/(auth)/register')}
            className="w-full py-4"
            variant="primary"
          >
            S'inscrire
          </Button>
        </View>

        {/* Arrow circle button */}
        <TouchableOpacity
          onPress={() => router.push('/onboarding')}
          className="mt-8 w-14 h-14 rounded-full items-center justify-center bg-periwinkle"
          activeOpacity={0.7}
        >
          <IconSymbol name="arrow.right" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Question mark at bottom */}
      <View className="items-center pb-8">
        <IconSymbol name="questionmark.circle.fill" size={22} color="#7E6BAD" />
      </View>
    </View>
  );
}