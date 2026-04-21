import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { WebContainer } from '@/components/ui/web-container';

// Sample data to match the mockup
const ENTRIES = [
  { id: '1', date: '3\ndec', title: 'Titre' },
  { id: '2', date: '4\ndec', title: 'Titre' },
  { id: '3', date: '5\ndec', title: 'Titre' },
  { id: '4', date: '6\ndec', title: 'Titre' },
  { id: '5', date: '7\ndec', title: 'Titre' },
];

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  return (
    <View 
      className="flex-1 bg-lavender-200"
      style={{ paddingLeft: isWeb ? 90 : 0, paddingTop: isWeb ? 0 : (insets.top || 14) }}
    >
      <WebContainer maxWidth={800} className="flex-1 px-5">
      {/* Header Title Pill */}
      <View className="items-center mb-6">
        <View className="px-10 py-2 border border-lavender-700 bg-lavender-100 rounded-full">
          <ThemedText className="text-xl font-bold" lightColor="#6B5B95">Journal</ThemedText>
        </View>
      </View>

      {/* Search Bar & Add Button */}
      <View className="flex-row items-center gap-3 mb-6">
        <View className="flex-1 flex-row items-center bg-lavender-100 border border-lavender-700 rounded-full px-4 py-2">
          <TextInput 
            placeholder="Recherche" 
            className="flex-1 text-base"
            placeholderTextColor="#9A8EC1"
          />
          <IconSymbol name="magnifyingglass" size={20} color="#6B5B95" />
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/journal-entry')}
          className="w-12 h-12 rounded-full border border-lavender-700 bg-lavender-100 items-center justify-center shadow-sm"
        >
          <IconSymbol name="plus" size={28} color="#6B5B95" />
        </TouchableOpacity>
      </View>

      {/* Journal List */}
      <FlatList
        data={ENTRIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 16, paddingBottom: isWeb ? 40 : (120 + insets.bottom) }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => router.push('/journal-entry')}
            className="flex-row items-center h-16"
          >
            {/* Date Circle in Black Tab */}
            <View className="bg-lavender-700 rounded-l-3xl p-1 pr-0 h-full justify-center">
               <View className="w-12 h-12 rounded-full bg-lavender-100 items-center justify-center border border-lavender-700 ml-1">
                  <ThemedText className="text-[10px] font-bold text-center leading-3" lightColor="#2D2347">
                    {item.date}
                  </ThemedText>
               </View>
            </View>
            {/* Title Content */}
            <View className="flex-1 h-full bg-lavender-100 border border-lavender-700 rounded-r-3xl justify-center px-6">
              <ThemedText className="text-lg font-semibold" lightColor="#2D2347">{item.title}</ThemedText>
            </View>
          </TouchableOpacity>
        )}
      />
      </WebContainer>
    </View>
  );
}