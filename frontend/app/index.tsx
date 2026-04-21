import React from 'react';
import { View, TouchableOpacity, Dimensions, Image, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/app/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { WebContainer } from '@/components/ui/web-container';

const { width: windowWidth } = Dimensions.get('window');

export default function WelcomeScreen() {
  const isWeb = Platform.OS === 'web';
  const displayWidth = isWeb ? Math.min(windowWidth, 800) : windowWidth;

  return (
    <View className="flex-1 bg-lavender-200">
      {/* Purple curved top section */}
      <View className="relative items-center" style={{ height: '45%' }}>
        {/* Background arc shape */}
        <View
          className="absolute bg-orchid"
          style={{
            width: displayWidth * 2,
            height: displayWidth * 2,
            borderRadius: displayWidth,
            top: -(displayWidth * 2) + (displayWidth * 0.85),
            left: '50%',
            marginLeft: -displayWidth,
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
      <WebContainer maxWidth={800} className="flex-1 items-center justify-center px-10">
        <View className="w-full items-center">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/home')}
            activeOpacity={0.8}
            className="w-full items-center"
          >
            <Image
              source={require('@/assets/images/franceconnect-btn.png')}
              style={{ width: 280, height: 60 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </WebContainer>

      {/* Question mark at bottom */}
      <View className="items-center pb-8">
        <IconSymbol name="questionmark.circle.fill" size={22} color="#7E6BAD" />
      </View>
    </View>
  );
}