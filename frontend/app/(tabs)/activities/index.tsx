import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, TouchableOpacity, View, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { WebContainer } from '@/components/ui/web-container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listActivities } from '@/lib/repositories';
import type { ActivityRow } from '@/types/database';
import { cn } from '@/lib/utils';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ActivitiesListScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isWeb = Platform.OS === 'web';

  const [items, setItems] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Match Home page colors
  const mainBg = isDark ? '#6B6588' : '#9896D4';
  const cardBg = '#F2F2F7';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listActivities();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: mainBg, paddingLeft: isWeb ? 100 : 0 }}
      >
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: mainBg, paddingLeft: isWeb ? 100 : 0, paddingTop: isWeb ? 20 : insets.top }}
    >
      <WebContainer maxWidth={800} className="flex-1 px-6 pb-10">
        {/* Header - Aligned with Home & Quiz */}
        <View className="mb-12">
          {/* Back Button styled like Home Pills */}
          <TouchableOpacity 
            onPress={() => router.replace('/home')}
            activeOpacity={0.7}
            className="mb-8 self-start px-8 py-3 rounded-full shadow-sm"
            style={{ backgroundColor: cardBg }}
          >
            <ThemedText className="text-black font-black text-sm tracking-tight">← RETOUR</ThemedText>
          </TouchableOpacity>

          <View className="items-center">
            <View className="rounded-full px-12 py-3 shadow-sm" style={{ backgroundColor: cardBg }}>
              <ThemedText className="text-xl font-black text-black tracking-tight uppercase">Activités</ThemedText>
            </View>
            <ThemedText className="text-center text-white/90 max-w-sm mt-6 text-lg leading-7 font-medium">
              Des exercices simples pour retrouver calme et sérénité au quotidien.
            </ThemedText>
          </View>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 24, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: '/activities/[slug]',
                  params: { slug: item.slug },
                })
              }
              className="rounded-[40px] p-8 shadow-sm border border-neutral-100 flex-row items-center"
              style={{ backgroundColor: cardBg }}
            >
              <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-white mr-8 shadow-inner">
                <ThemedText className="text-3xl">
                  {item.type === 'breathing' ? '🧘' : item.type === 'meditation' ? '✨' : '💡'}
                </ThemedText>
              </View>
              <View className="flex-1">
                <ThemedText className="text-2xl font-black text-black capitalize mb-1 tracking-tight">
                  {item.title}
                </ThemedText>
                <ThemedText className="text-sm text-neutral-500 uppercase tracking-widest font-bold">
                  {item.type === 'breathing' ? 'Respiration' : item.type === 'meditation' ? 'Méditation' : 'Conseils'}
                </ThemedText>
              </View>
              <View className="h-14 w-14 items-center justify-center rounded-full bg-white/50 border border-neutral-200 ml-4">
                <ThemedText className="text-black text-3xl font-black">→</ThemedText>
              </View>
            </TouchableOpacity>
          )}
        />
      </WebContainer>
    </View>
  );
}
