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
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
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
  const [isShared, setIsShared] = useState(false);
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
        setIsShared(row.is_shared);
      }
    } finally {
      setLoading(false);
    }
  }, [user, entryId]);

  useFocusEffect(
    useCallback(() => {
      if (!entryId) {
        setTitle('');
        setBody('');
        setMood(null);
        setIsShared(false);
        setLoading(false);
      } else {
        void load();
      }
    }, [entryId, load])
  );

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
        is_shared: isShared,
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

    const performDelete = async () => {
      await deleteJournalEntry(user.id, entryId);
      router.replace('/book');
    };

    if (Platform.OS === 'web') {
      if (confirm('Voulez-vous vraiment supprimer cette note ?')) {
        void performDelete();
      }
    } else {
      Alert.alert(
        'Supprimer',
        'Voulez-vous vraiment supprimer cette note ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Supprimer', 
            style: 'destructive',
            onPress: performDelete
          }
        ]
      );
    }
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
      style={{ backgroundColor: mainBg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <WebContainer maxWidth={800} className="flex-1 px-6">
        {/* Header - Single Row Alignment */}
        <View 
          style={{ 
            marginTop: isWeb ? 24 : insets.top + 16, 
            marginBottom: 30,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center', // Center title
            height: 44,
            position: 'relative',
          }}
        >
          <TouchableOpacity 
            onPress={() => router.replace('/book')}
            activeOpacity={0.7}
            style={{ position: 'absolute', left: 0 }}
            className="w-11 h-11 items-center justify-center rounded-full shadow-sm bg-[#F2F2F7]"
          >
            <IconSymbol name="chevron.left" size={24} color="#000" />
          </TouchableOpacity>

          <View className="rounded-full border border-black/10 px-12 py-2 bg-white shadow-sm">
            <ThemedText className="text-xl font-black text-black">Journal</ThemedText>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="white" size="large" />
          </View>
        ) : (
          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ flexGrow: 1 }}
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
              <View className="h-[1px] bg-black/5" />
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

            {/* Shared with Doctor Selector */}
            <View className="mb-8 px-2">
              <ThemedText className="text-sm font-black text-white/70 uppercase tracking-widest mb-4">
                Partager avec votre médecin ?
              </ThemedText>
              <View className="flex-row gap-4">
                <TouchableOpacity 
                   onPress={() => setIsShared(true)}
                   activeOpacity={0.8}
                   className={cn(
                     "flex-1 h-14 rounded-2xl items-center justify-center flex-row gap-2 border-2",
                     isShared ? "bg-white border-white shadow-md" : "bg-white/10 border-white/20"
                   )}
                >
                  <View className={cn("w-5 h-5 rounded-full border-2 items-center justify-center", isShared ? "border-black" : "border-white/40")}>
                    {isShared && <View className="w-2.5 h-2.5 rounded-full bg-black" />}
                  </View>
                  <ThemedText className={cn("font-black uppercase tracking-widest text-xs", isShared ? "text-black" : "text-white/40")}>Oui</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                   onPress={() => setIsShared(false)}
                   activeOpacity={0.8}
                   className={cn(
                     "flex-1 h-14 rounded-2xl items-center justify-center flex-row gap-2 border-2",
                     !isShared ? "bg-white border-white shadow-md" : "bg-white/10 border-white/20"
                   )}
                >
                  <View className={cn("w-5 h-5 rounded-full border-2 items-center justify-center", !isShared ? "border-black" : "border-white/40")}>
                    {!isShared && <View className="w-2.5 h-2.5 rounded-full bg-black" />}
                  </View>
                  <ThemedText className={cn("font-black uppercase tracking-widest text-xs", !isShared ? "text-black" : "text-white/40")}>Non</ThemedText>
                </TouchableOpacity>
              </View>
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

            {entryId && (
              <TouchableOpacity 
                onPress={onDelete}
                className="mt-6 h-14 w-full rounded-[24px] border-2 border-white/20 items-center justify-center"
              >
                <ThemedText className="text-white/40 font-black uppercase tracking-widest text-xs">Supprimer cette note</ThemedText>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </WebContainer>
    </KeyboardAvoidingView>
  );
}
