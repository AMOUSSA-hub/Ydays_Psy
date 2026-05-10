import React, { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  View,
  ScrollView,
  Platform,
  TouchableOpacity,
  Text,
  useWindowDimensions,
  StatusBar,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { WebContainer } from '@/components/ui/web-container';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  listJournalEntries,
  listMoodLogs,
  listQuestionnaires,
} from '@/lib/repositories';
import type { MoodLogRow } from '@/types/database';

const QUOTE =
  '« Il y a des silences qui en disent long, comme il y a des paroles qui ne signifient rien. »';

const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const WEEKDAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function isoDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const quoteFontFamily = Platform.select({
  web: "'Brush Script MT', 'Segoe Script', 'Apple Chancery', 'Snell Roundhand', cursive",
  ios: 'Snell Roundhand',
  default: 'serif',
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  // Increase maxWidth for landscape web feel
  const displayWidth = isWeb ? Math.min(windowWidth - 140, 1000) : windowWidth;

  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [moods, setMoods] = useState<MoodLogRow[]>([]);
  const [journalCount, setJournalCount] = useState(0);
  const [bilanSlug, setBilanSlug] = useState('phq9-lite');
  const [loading, setLoading] = useState(true);

  const mainBg = isDark ? '#6B6588' : '#9896D4';

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [moodList, entries, questionnaires] = await Promise.all([
        listMoodLogs(user.id),
        listJournalEntries(user.id),
        listQuestionnaires(),
      ]);
      setMoods(moodList);
      setJournalCount(entries.length);
      if (questionnaires[0]?.slug) setBilanSlug(questionnaires[0].slug);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const todayIso = useMemo(() => isoDateOnly(new Date()), []);

  const weekStrip = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      days.push(d);
    }
    const moodByDate = new Map(moods.map((m) => [m.logged_date, m.mood_score]));
    return days.map((d) => {
      const iso = isoDateOnly(d);
      const score = moodByDate.get(iso);
      return {
        key: iso,
        isToday: iso === todayIso,
        month: MONTHS_FR[d.getMonth()],
        day: d.getDate(),
        weekday: WEEKDAYS_FR[d.getDay()],
        moodScore: score,
      };
    });
  }, [moods, todayIso]);

  if (!user) return null;

  return (
    <View className="flex-1" style={{ backgroundColor: mainBg, paddingLeft: isWeb ? 100 : 0 }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className={cn("flex-row items-center justify-center px-6", isWeb ? "py-6" : "pt-12 pb-4")}>
        <View className="rounded-full bg-[#F2F2F7] px-10 py-2 shadow-sm">
          <Text className="text-xl font-black tracking-tight text-black">Ochitsu</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: isWeb ? 48 : 120 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <WebContainer maxWidth={displayWidth} className="space-y-6 px-6">
          
          {/* Quote Card */}
          <View className="rounded-[40px] bg-[#F2F2F7] p-8 shadow-sm border border-neutral-100">
            <Text
              className="text-center text-xl leading-8 text-neutral-800"
              style={{
                fontFamily: quoteFontFamily,
                fontStyle: 'italic',
              }}
            >
              {QUOTE}
            </Text>
          </View>

          {/* Calendar Strip - Spread Out */}
          <View className="flex-row justify-between w-full">
            {weekStrip.map((d) => (
              <View 
                key={d.key} 
                className={cn(
                  "items-center rounded-full py-6 px-1 w-[13%] shadow-sm",
                  d.isToday ? "bg-white" : "bg-white/60"
                )}
              >
                <Text className="text-[10px] font-bold text-black uppercase opacity-60">{d.month}</Text>
                <Text className="text-2xl font-black text-black my-2">{d.day}</Text>
                <Text className="text-[10px] font-medium text-black opacity-60">{d.weekday.slice(0, 5)}</Text>
              </View>
            ))}
          </View>

          {/* Main Content Area */}
          <View className={cn("flex-row gap-6", isWeb ? "h-[300px]" : "h-[220px]")}>
            {/* Companion Card */}
            <TouchableOpacity
              onPress={() => router.push('/character')}
              activeOpacity={0.9}
              className="flex-1 h-full"
            >
              <View className="h-full items-center justify-center rounded-[40px] bg-[#F2F2F7] shadow-sm overflow-hidden">
                <Image 
                  source={require('@/assets/images/figma/monster.png')} 
                  resizeMode="contain"
                  style={{ width: '80%', height: '80%' }}
                />
              </View>
            </TouchableOpacity>

            {/* Right Stack */}
            <View className="flex-1 gap-4">
              <TouchableOpacity onPress={() => router.push('/book')} activeOpacity={0.9} className="flex-1">
                <View className="flex-1 items-center justify-center rounded-[36px] bg-[#F2F2F7] p-4 shadow-sm">
                  <Text className="text-2xl font-black text-black mb-2">Journal</Text>
                  <Image 
                    source={require('@/assets/images/figma/notebook.png')} 
                    resizeMode="contain"
                    style={{ width: 60, height: 60 }}
                  />
                </View>
              </TouchableOpacity>

              {/* Side-by-side: Quizz & Exercises */}
              <View className="flex-1 flex-row gap-4">
                <TouchableOpacity 
                  onPress={() => router.push('/quiz')} 
                  activeOpacity={0.9} 
                  className="flex-1"
                >
                  <View className="flex-1 items-center justify-center rounded-[30px] bg-[#F2F2F7] shadow-sm">
                    <Text className="text-lg font-black text-black mb-2">Quizz</Text>
                    <Image 
                      source={require('@/assets/images/figma/question.png')} 
                      resizeMode="contain"
                      style={{ width: 50, height: 50 }}
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/activities')}
                  activeOpacity={0.9}
                  className="flex-1"
                >
                  <View className="flex-1 items-center justify-center rounded-[30px] bg-[#F2F2F7] shadow-sm">
                    <Text className="text-lg font-black text-black mb-2">Exercice</Text>
                    <IconSymbol name="heart.fill" size={28} color="#000" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </WebContainer>
      </ScrollView>
    </View>
  );
}
