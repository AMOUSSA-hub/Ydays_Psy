import React from 'react';
import { View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { WebContainer } from '@/components/ui/web-container';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JournalEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  return (
    <View 
      className="flex-1 bg-lavender-200"
      style={{ paddingLeft: isWeb ? 90 : 0, paddingTop: 0 }}
    >
      <WebContainer maxWidth={800} className="flex-1 px-6 py-10">
      {/* Header with Back Button */}
      <View className="flex-row items-center mb-6 gap-3">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full border border-lavender-700 bg-lavender-100"
        >
          <IconSymbol name="chevron.left" size={24} color="#6B5B95" />
        </TouchableOpacity>
        <View className="flex-1 px-6 py-3 border border-lavender-700 bg-lavender-100 rounded-full">
          <TextInput 
            placeholder="Titre" 
            className="text-lg font-bold"
            placeholderTextColor="#9A8EC1"
          />
        </View>
      </View>

      {/* Main Content Area */}
      <View 
        className="flex-1 bg-lavender-50 border border-lavender-400 rounded-[32px] p-8 mb-10 relative shadow-sm"
        style={{ minHeight: isWeb ? 500 : 400 }}
      >
        <TextInput
          multiline
          placeholder="Commencez à écrire ici..."
          style={{ textAlignVertical: 'top', flex: 1 }}
          className="text-lg leading-6"
          placeholderTextColor="#9A8EC1"
        />

        {/* Floating Toolbar on Right */}
        <View className="absolute right-4 top-[20%] bg-lavender-100 border border-lavender-700 rounded-full py-5 px-2 gap-5 items-center shadow-md">
          <TouchableOpacity activeOpacity={0.6}>
            <IconSymbol name="bold" size={22} color="#2D2347" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6}>
            <IconSymbol name="italic" size={22} color="#2D2347" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6}>
            <IconSymbol name="underline" size={22} color="#2D2347" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6}>
            <IconSymbol name="strikethrough" size={22} color="#2D2347" />
          </TouchableOpacity>
          
          <View className="w-6 h-[1px] bg-lavender-700 opacity-30" />
          
          <TouchableOpacity activeOpacity={0.6}>
            <IconSymbol name="textformat.size" size={22} color="#2D2347" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6}>
            <IconSymbol name="paintbrush.fill" size={22} color="#2D2347" />
          </TouchableOpacity>
        </View>
        </View>
      </WebContainer>
    </View>
  );
}
