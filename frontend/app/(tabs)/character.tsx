import React, { useCallback, useState } from 'react';
import { Platform, View, StatusBar, Image, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { WebContainer } from '@/components/ui/web-container';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

export default function CharacterScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Match Home page colors
  const mainBg = isDark ? '#6B6588' : '#9896D4';
  const cardBg = '#F2F2F7';

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1" 
      style={{ 
        backgroundColor: mainBg, 
      }}
    >
      <StatusBar barStyle="light-content" />
      <WebContainer maxWidth={800} className="flex-1">
        {/* Header */}
        <View 
          style={{ 
            marginTop: isWeb ? 24 : insets.top + 16, 
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            height: 44,
          }}
        >
          <View className="w-11" />
          <View className="rounded-full px-12 py-3 shadow-sm" style={{ backgroundColor: cardBg }}>
            <ThemedText className="text-xl font-black text-black tracking-tight uppercase">Ochitsu Bot</ThemedText>
          </View>
          <View className="w-11" />
        </View>

        <View className="flex-1 px-6">
          <View className="flex-1 items-center justify-center">
            {/* Background Monster Watermark */}
            <View className="opacity-10 items-center">
              <Image 
                source={require('@/assets/images/figma/monster.png')} 
                style={{ width: 300, height: 300 }}
                resizeMode="contain"
              />
              <ThemedText className="mt-4 text-white/40 font-bold uppercase tracking-[10px]">Avenir</ThemedText>
            </View>
          </View>

          {/* Mock Input Bar */}
          <View className={cn(
            "flex-row items-center bg-white/20 rounded-[30px] px-6 py-3 border border-white/30 backdrop-blur-md",
            isWeb ? "mb-10" : "mb-4"
          )}>
            <TextInput 
              placeholder="Écrivez un message..." 
              placeholderTextColor="rgba(255,255,255,0.6)"
              className="flex-1 text-white font-medium mr-4"
              editable={true}
            />
            <TouchableOpacity className="h-10 w-10 bg-white rounded-full items-center justify-center shadow-sm">
              <ThemedText className="text-black font-black">↑</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </WebContainer>
    </KeyboardAvoidingView>
  );
}
