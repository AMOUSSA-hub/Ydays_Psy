import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, TouchableOpacity, View, Platform, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { WebContainer } from '@/components/ui/web-container';
import { listQuestionnaires } from '@/lib/repositories';
import type { QuestionnaireRow } from '@/types/database';
import { cn } from '@/lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function QuizListScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isWeb = Platform.OS === 'web';

  const [items, setItems] = useState<QuestionnaireRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Match Home page colors
  const mainBg = isDark ? '#6B6588' : '#9896D4';
  const cardBg = '#F2F2F7';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listQuestionnaires());
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
      style={{ backgroundColor: mainBg }}
    >
      <WebContainer maxWidth={800} className="flex-1 px-6 pb-10">
        {/* Header - Aligned with Home */}
        <View 
          style={{ 
            marginTop: isWeb ? 24 : insets.top + 16, 
            marginBottom: 30,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 44,
          }}
        >
          <TouchableOpacity 
            onPress={() => router.replace('/home')}
            activeOpacity={0.7}
            className="w-11 h-11 items-center justify-center rounded-full shadow-sm bg-[#F2F2F7]"
          >
            <IconSymbol name="chevron.left" size={24} color="#000" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <View className="rounded-full px-12 py-3 shadow-sm" style={{ backgroundColor: cardBg }}>
              <ThemedText className="text-xl font-black text-black tracking-tight uppercase">Bilans & Quizz</ThemedText>
            </View>
          </View>

          <View className="w-11" />
        </View>

        <View className="items-center mb-10">
          <ThemedText className="text-center text-white/90 max-w-sm text-lg leading-7 font-medium">
            Prenez quelques instants pour évaluer votre bien-être actuel.
          </ThemedText>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 24, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/quiz/[slug]',
                  params: { slug: item.slug },
                })
              }
              activeOpacity={0.9}
              className="rounded-[40px] p-8 shadow-sm border border-neutral-100 flex-row items-center"
              style={{ backgroundColor: cardBg }}
            >
              <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-white mr-8 shadow-inner">
                <Image 
                  source={require('@/assets/images/figma/question.png')} 
                  style={{ width: 45, height: 45, resizeMode: 'contain' }}
                />
              </View>
              <View className="flex-1">
                <ThemedText className="text-2xl font-black text-black mb-2 tracking-tight">
                  {item.title}
                </ThemedText>
                <ThemedText className="text-base text-neutral-600 leading-6" numberOfLines={3}>
                  {item.description || 'Évaluation rapide de votre état émotionnel.'}
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
