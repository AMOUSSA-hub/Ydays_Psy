import React from 'react';
import { View, Dimensions } from 'react-native';
import { Button } from '@/app/components/ui/button';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  return (
    <View className="flex-1 bg-white">
      {/* Top curved purple/blue gradient area */}
      <View className="relative" style={{ height: '55%' }}>
        <View
          className="absolute bg-periwinkle-light"
          style={{
            width: width * 2.5,
            height: width * 2.5,
            borderRadius: width * 1.25,
            bottom: 0,
            left: -(width * 0.75),
          }}
        />
        {/* Overlay arc for depth */}
        <View
          className="absolute bg-periwinkle"
          style={{
            width: width * 2,
            height: width * 2,
            borderRadius: width,
            bottom: -width * 0.3,
            left: -(width / 2),
            opacity: 0.5,
          }}
        />
      </View>

      {/* Bottom section with button */}
      <View className="flex-1 items-center justify-center px-10">
        <Button
          onPress={() => router.replace('/(tabs)/home')}
          variant="white"
          className="w-56 py-4 border border-lavender-400"
        >
          Commencer
        </Button>
      </View>
    </View>
  );
}