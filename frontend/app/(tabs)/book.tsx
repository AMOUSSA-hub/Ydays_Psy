import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, TextInput, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebContainer } from '@/components/ui/web-container';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { listJournalEntries } from '@/lib/repositories';
import type { JournalEntryRow } from '@/types/database';

const MONTHS_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'
];

function formatDay(iso: string): string {
  const d = new Date(iso);
  return d.getDate().toString();
}

function formatMonth(iso: string): string {
  const d = new Date(iso);
  return MONTHS_SHORT[d.getMonth()];
}

export default function BookScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [entries, setEntries] = useState<JournalEntryRow[]>([]);
  const [query, setQuery] = useState('');
  
  // Theme colors
  const mainBg = isDark ? '#6B6588' : '#9896D4';

  const load = useCallback(async () => {
    if (!user) return;
    const data = await listJournalEntries(user.id);
    setEntries(data);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q)
    );
  }, [entries, query]);

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: mainBg, paddingLeft: isWeb ? 100 : 0, paddingTop: isWeb ? 0 : insets.top || 14 }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <WebContainer maxWidth={800} className="flex-1 px-5">
        
        {/* Figma Header: "Journal" in a capsule */}
        <View className="mb-8 mt-4 items-center">
          <View className="rounded-full border border-black/10 px-16 py-2 bg-white shadow-sm">
            <ThemedText className="text-2xl font-black text-black">Journal</ThemedText>
          </View>
        </View>

        {/* Figma Search Row: Search bar + (+) button */}
        <View className="mb-10 flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center rounded-full border border-black/20 bg-white px-5 py-3">
            <TextInput
              placeholder="Recherche"
              placeholderTextColor="#00000044"
              className="flex-1 text-lg font-medium text-black"
              value={query}
              onChangeText={setQuery}
            />
            <IconSymbol name="magnifyingglass" size={22} color="#000" />
          </View>
          
          <TouchableOpacity
            onPress={() => router.push('/journal-entry')}
            activeOpacity={0.8}
            className="h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm"
          >
            <ThemedText className="text-4xl font-black text-black/30">+</ThemedText>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 24, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <ThemedText className="text-center text-black/20 font-bold italic">
                {query ? 'Aucune pensée ne correspond...' : 'Votre journal est vide.\nÉcrivez votre première note.'}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: '/journal-entry',
                    params: { id: item.id },
                  })
                }
                // Entry Card Structure from Figma: Black container, white circle (date), white pill (title)
                className="relative h-24 w-full flex-row items-center bg-black rounded-[40px] px-2 shadow-lg"
              >
                {/* Left Date Circle */}
                <View className="h-20 w-20 items-center justify-center rounded-full bg-white ml-1">
                  <ThemedText className="text-xl font-black text-black leading-tight text-center">
                    {formatDay(item.created_at)}
                    {"\n"}
                    <ThemedText className="text-[10px] font-bold text-black/60 uppercase">
                      {formatMonth(item.created_at)}
                    </ThemedText>
                  </ThemedText>
                </View>

                {/* Right Title Pill */}
                <View className="flex-1 h-20 bg-white rounded-[32px] ml-3 mr-1 justify-center px-8 border-l-8 border-black">
                  <ThemedText className="text-xl font-black text-black" numberOfLines={1}>
                    {item.title || 'Sans titre'}
                  </ThemedText>
                  <ThemedText className="text-xs font-bold text-black/30 uppercase tracking-widest">
                    {item.mood_score ? ['Triste', 'Bof', 'Neutre', 'Bien', 'Super'][item.mood_score - 1] : 'Pensée'}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            );
          }}
        />

      </WebContainer>
    </View>
  );
}
