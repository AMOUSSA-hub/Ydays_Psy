import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  View,
  StatusBar,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { WebContainer } from '@/components/ui/web-container';
import { useAuth } from '@/contexts/auth-context';

export default function WelcomeScreen() {
  const { user, initialized, signInAnonymous } = useAuth();
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (initialized && user) {
      router.replace('/(tabs)/home');
    }
  }, [initialized, user]);

  async function handleFranceConnect() {
    try {
      await signInAnonymous();
      router.replace('/(tabs)/home');
    } catch (e) {
      console.error(e);
    }
  }

  if (!initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-[#9896D4]">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (user) {
    return null;
  }

  return (
    <View className="flex-1 bg-[#9896D4] items-center justify-center">
      <StatusBar barStyle="light-content" />

      <WebContainer maxWidth={isWeb ? 500 : 400} className="flex-1 w-full items-center justify-center px-6">
        {/* Logo */}
        <Image
          source={require('@/assets/images/Ochitsu.png')}
          style={{ width: 200, height: 200, resizeMode: 'contain' }}
        />

        {/* App Name */}
        <ThemedText className="text-white text-5xl font-black tracking-tighter mt-4 mb-2">
          Ochitsu
        </ThemedText>

        {/* Tagline */}
        <ThemedText className="text-white/70 text-center text-base font-medium mb-16">
          Votre sanctuaire de paix intérieure{'\n'}et de bien-être quotidien.
        </ThemedText>

        {/* FranceConnect Button */}
        <TouchableOpacity
          onPress={handleFranceConnect}
          activeOpacity={0.85}
          style={{
            borderRadius: 4,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Image
            source={require('@/assets/images/franceconnect-btn.png')}
            style={{
              width: 230,
              height: 56,
              resizeMode: 'contain',
            }}
          />
        </TouchableOpacity>
      </WebContainer>
    </View>
  );
}
