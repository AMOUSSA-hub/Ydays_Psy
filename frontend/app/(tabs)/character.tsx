import React, { useCallback, useMemo, useState } from 'react';
import { Platform, View, StatusBar, Image, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { WebContainer } from '@/components/ui/web-container';
import { router, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
import { countActivitySessions, listMoodLogs } from '@/lib/repositories';
import type { MoodLogRow } from '@/types/database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CharacterScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [moods, setMoods] = useState<MoodLogRow[]>([]);
  const [sessions, setSessions] = useState(0);

  // Match Home page colors
  const mainBg = isDark ? '#6B6588' : '#9896D4';
  const cardBg = '#F2F2F7';

  const load = useCallback(async () => {
    if (!user) return;
    const [ml, sc] = await Promise.all([
      listMoodLogs(user.id),
      countActivitySessions(user.id),
    ]);
    setMoods(ml);
    setSessions(sc);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const avgMood = useMemo(() => {
    if (!moods.length) return null;
    const s = moods.reduce((a, b) => a + b.mood_score, 0);
    return s / moods.length;
  }, [moods]);

  const message = useMemo(() => {
    if (avgMood == null) {
      return 'Je commence à vous connaître… Notez votre humeur dans l’agenda pour que je grandisse avec vous.';
    }
    if (avgMood >= 4) {
      return 'Vous semblez en forme ces derniers temps ! Continuez les petits rituels qui vous font du bien.';
    }
    if (avgMood >= 2.5) {
      return 'Les nuances sont normales. Une courte méditation ou une entrée de journal peut déjà aider.';
    }
    return 'Je suis là avec vous. Les journées difficiles méritent soutien — pensez aux lignes d’aide si besoin.';
  }, [avgMood]);

  return (
    <View className="flex-1" style={{ backgroundColor: mainBg, paddingLeft: isWeb ? 100 : 0, paddingTop: isWeb ? 20 : insets.top }}>
      <StatusBar barStyle="light-content" />
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
              <ThemedText className="text-xl font-black text-black tracking-tight uppercase">Compagnon</ThemedText>
            </View>
            <ThemedText className="text-center text-white/90 max-w-sm mt-6 text-lg leading-7 font-medium">
              Votre allié quotidien pour votre bien-être émotionnel.
            </ThemedText>
          </View>
        </View>

        <View className="flex-1 items-center justify-center w-full">
          <View className="rounded-[45px] p-10 items-center shadow-2xl w-full max-w-sm border border-neutral-100" style={{ backgroundColor: cardBg }}>
            <View className="mb-10 h-64 w-64 items-center justify-center rounded-[40px] bg-white shadow-inner overflow-hidden p-6 border border-neutral-100">
              <Image 
                source={require('@/assets/images/figma/monster.png')} 
                resizeMode="contain"
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            
            <ThemedText className="mb-6 text-center text-2xl font-black text-black tracking-tight">
              Ochitsu Bot
            </ThemedText>
            
            <ThemedText className="mb-10 text-center text-lg leading-8 text-neutral-700 font-medium italic">
              "{message}"
            </ThemedText>
            
            <View className="rounded-[25px] bg-white border border-neutral-100 px-10 py-5 shadow-sm">
              <ThemedText className="text-center text-sm font-black text-black uppercase tracking-widest">
                Séances : {sessions}
              </ThemedText>
            </View>
          </View>
        </View>
      </WebContainer>
    </View>
  );
}
