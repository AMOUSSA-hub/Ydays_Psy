import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { WebContainer } from '@/components/ui/web-container';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { getJournalEntry, saveJournalEntry, deleteJournalEntry } from '@/lib/repositories';
import { cn } from '@/lib/utils';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function JournalEntryScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const entryId = typeof params.id === 'string' ? params.id : params.id?.[0];
  const isWeb = Platform.OS === 'web';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mainBg = isDark ? '#6B6588' : '#9896D4';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [loading, setLoading] = useState(!!entryId);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user || !entryId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const row = await getJournalEntry(user.id, entryId);
      if (row) {
        setTitle(row.title);
        setBody(row.body);
        setMood(row.mood_score);
      }
    } finally {
      setLoading(false);
    }
  }, [user, entryId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave() {
    if (!user || saving) return;
    setSaving(true);
    try {
      // Ensure we pass the entryId to prevent duplicates
      await saveJournalEntry(user.id, {
        id: entryId, 
        title: title.trim() || 'Sans titre',
        body: body.trim(),
        mood_score: mood,
      });
      router.replace('/book');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Sauvegarde impossible');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!user || !entryId) return;
    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer cette note ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            await deleteJournalEntry(user.id, entryId);
            router.replace('/book');
          }
        }
      ]
    );
  }

  const moodOptions = [
    { score: 1, emoji: '😢', label: 'Triste' },
    { score: 2, emoji: '🙁', label: 'Bof' },
    { score: 3, emoji: '😐', label: 'Neutre' },
    { score: 4, emoji: '🙂', label: 'Bien' },
    { score: 5, emoji: '😊', label: 'Super' },
  ];

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: mainBg, paddingLeft: isWeb ? 100 : 0 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <WebContainer maxWidth={800} className="flex-1 px-6">
        {/* Header - Adjusted for the global settings button */}
        <View 
          className="flex-row items-center justify-between"
          style={{ paddingTop: isWeb ? 20 : Math.max(insets.top, 20), marginBottom: 30 }}
        >
          <View className="flex-row items-center">
            {/* Shifted back button to avoid overlapping with global settings button */}
            <View style={{ width: 60 }} /> 
            <TouchableOpacity
              onPress={() => router.replace('/book')}
              className="h-12 w-12 items-center justify-center rounded-full bg-[#F2F2F7] shadow-sm"
            >
              <ThemedText className="text-black font-black text-xl">←</ThemedText>
            </TouchableOpacity>
          </View>
          
          <ThemedText className="text-xl font-black text-white">Journal</ThemedText>

          {entryId ? (
            <TouchableOpacity onPress={onDelete} className="h-12 w-12 items-center justify-center">
              <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
            </TouchableOpacity>
          ) : (
            <View className="w-12" />
          )}
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="white" size="large" />
          </View>
        ) : (
          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 60 }}
          >
            <View className="mb-6">
              <ThemedText className="text-sm font-black text-white/60 uppercase tracking-widest mb-4 text-center">
                Comment vous sentez-vous ?
              </ThemedText>
              <View className="flex-row justify-between px-2">
                {moodOptions.map((opt) => {
                  const isSelected = mood === opt.score;
                  return (
                    <TouchableOpacity
                      key={opt.score}
                      onPress={() => setMood(opt.score)}
                      className="items-center"
                    >
                      <View className={cn(
                        "h-14 w-14 items-center justify-center rounded-2xl mb-2",
                        isSelected ? "bg-white shadow-lg scale-110" : "bg-[#F2F2F7]/20"
                      )}>
                        <ThemedText className="text-2xl">{opt.emoji}</ThemedText>
                      </View>
                      <ThemedText className={cn(
                        "text-[9px] font-black uppercase",
                        isSelected ? "text-white" : "text-white/40"
                      )}>
                        {opt.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Structured Editor Card - Improved for smaller viewports */}
            <View className="mb-6 rounded-[32px] bg-[#F2F2F7] p-6 shadow-sm">
              <TextInput
                placeholder="Titre..."
                value={title}
                onChangeText={setTitle}
                className="text-xl font-black text-black mb-4"
                placeholderTextColor="rgba(0,0,0,0.2)"
              />
              <View className="h-[1px] bg-black/5 mb-4" />
              <TextInput
                multiline
                placeholder="Racontez votre journée..."
                value={body}
                onChangeText={setBody}
                style={{ textAlignVertical: 'top', minHeight: isWeb ? 200 : 250 }}
                className="text-base leading-6 text-neutral-800"
                placeholderTextColor="rgba(0,0,0,0.2)"
              />
            </View>

            <TouchableOpacity 
              onPress={onSave} 
              disabled={saving}
              activeOpacity={0.9}
              className="h-16 w-full rounded-[24px] bg-white items-center justify-center shadow-lg"
            >
              <ThemedText className="text-lg font-black text-black uppercase tracking-widest">
                {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        )}
      </WebContainer>
    </KeyboardAvoidingView>
  );
}
