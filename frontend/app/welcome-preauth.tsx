import React from 'react';
import { View, TouchableOpacity, Dimensions, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { WebContainer } from '@/components/ui/web-container';
import { useAuth } from '@/contexts/auth-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomePreauthScreen() {
  const { signInAnonymous } = useAuth();
  const isWeb = Platform.OS === 'web';
  const displayWidth = isWeb ? 1000 : SCREEN_WIDTH;

  async function onStart() {
    try {
      await signInAnonymous();
      router.replace('/(tabs)/home');
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <WebContainer maxWidth={displayWidth} className="flex-1">
        <View className="flex-1 items-center justify-center px-10">
          {/* Logo or Image could go here as per Figma */}
        </View>

        <View 
          className="bg-[#9896D4] items-center pt-16"
          style={{
            height: '55%',
            borderTopLeftRadius: isWeb ? 200 : 150,
            borderTopRightRadius: isWeb ? 200 : 150,
            width: isWeb ? '100%' : '110%',
            alignSelf: 'center',
            paddingBottom: 40,
          }}
        >
          <TouchableOpacity
            onPress={onStart}
            activeOpacity={0.9}
            className="bg-[#F2F2F7] px-20 py-5 rounded-full shadow-2xl active:scale-95 transition-all mb-8"
          >
            <ThemedText className="text-center text-2xl font-black text-[#4B3F72]">
              Commencer
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onStart}
            activeOpacity={0.8}
            className="border-2 border-white/40 px-10 py-3 rounded-full active:opacity-70 mb-8"
          >
            <ThemedText className="text-white text-lg font-bold">
              Continuer en mode anonyme
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/privacy')}
            className="opacity-80"
          >
            <ThemedText className="text-white text-sm font-medium underline">
              Notre politique de confidentialité
            </ThemedText>
          </TouchableOpacity>
        </View>
      </WebContainer>
    </View>
  );
}
