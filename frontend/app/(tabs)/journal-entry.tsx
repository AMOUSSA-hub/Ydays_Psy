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
  Modal,
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
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = true;
  recognition.lang = 'fr-FR';
  recognition.interimResults = false;
}

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
  const [image, setImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
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
        setImage(row.image_data || null);
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
        setImage(null);
        setIsListening(false);
        setCameraVisible(false);
        setLoading(false);
      } else {
        void load();
      }
      return () => {
        setCameraVisible(false);
        setIsListening(false);
      };
    }, [entryId, load])
  );

  const toggleListening = () => {
    if (Platform.OS !== 'web') {
      Alert.alert(
        "Dictée Vocale",
        "Pour dicter du texte sur mobile, utilisez la touche micro 🎙️ intégrée directement au clavier virtuel de votre téléphone."
      );
      return;
    }

    if (!recognition) {
      Alert.alert("Non supporté", "La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const resultIndex = event.resultIndex;
        const transcript = event.results[resultIndex][0].transcript;
        setBody((prev) => prev + (prev ? ' ' : '') + transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }
  };

  const handleAsset = async (asset: any) => {
    if (asset.base64) {
      setImage(`data:image/jpeg;base64,${asset.base64}`);
      return;
    }
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      setImage(asset.uri);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    if (useCamera) {
      if (Platform.OS === 'web') {
        if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
          setCameraPermission(true);
          setCameraVisible(true);
        } else {
          Alert.alert('Erreur', "La caméra n'est pas supportée par votre navigateur.");
        }
        return;
      }
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', "L'accès à l'appareil photo est requis.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.4,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        await handleAsset(result.assets[0]);
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', "L'accès à la galerie est requis.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.4,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        await handleAsset(result.assets[0]);
      }
    }
  };

  const takePhoto = () => {
    if (Platform.OS === 'web') {
      const videoEl = document.getElementById('webcam-preview') as HTMLVideoElement;
      if (videoEl) {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth || 640;
        canvas.height = videoEl.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          setImage(dataUrl);
          const stream = (videoEl as any)._stream;
          if (stream) {
            stream.getTracks().forEach((track: any) => track.stop());
          }
          setCameraVisible(false);
        }
      }
    }
  };

  async function onSave() {
    if (!user || saving) return;
    setSaving(true);
    try {
      await saveJournalEntry(user.id, {
        id: entryId, 
        title: title.trim() || 'Sans titre',
        body: body.trim(),
        mood_score: mood,
        image_data: image,
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
            justifyContent: 'center',
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
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-4">
              <ThemedText className="text-xs font-black text-white/60 uppercase tracking-widest mb-3 text-center">
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

            {/* Structured Editor Card */}
            <View style={{ padding: isWeb ? 24 : 16 }} className="mb-4 rounded-[28px] bg-[#F2F2F7] shadow-sm">
              <TextInput
                placeholder="Titre..."
                value={title}
                onChangeText={setTitle}
                className="text-lg font-black text-black mb-3"
                placeholderTextColor="rgba(0,0,0,0.2)"
              />
              <View className="h-[1px] bg-black/5" />
              <TextInput
                multiline
                placeholder="Racontez votre journée..."
                value={body}
                onChangeText={setBody}
                style={{ textAlignVertical: 'top', minHeight: isWeb ? 150 : 110 }}
                className="text-sm leading-5 text-neutral-800 mb-3"
                placeholderTextColor="rgba(0,0,0,0.2)"
              />

              {image && (
                <View style={{ position: 'relative', marginBottom: 12, borderRadius: 16, overflow: 'hidden' }}>
                  <Image source={{ uri: image }} style={{ width: '100%', height: isWeb ? 160 : 110 }} contentFit="cover" />
                  <TouchableOpacity
                    onPress={() => setImage(null)}
                    style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyIntent: 'center', justifyContent: 'center' }}
                  >
                    <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>✕</ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              {/* Boutons d'action (Photos, Dictée) */}
              <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 14 }}>
                <TouchableOpacity
                  onPress={toggleListening}
                  style={{ backgroundColor: isListening ? '#EF4444' : '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}
                >
                  <ThemedText style={{ fontSize: 16 }}>{isListening ? '🛑' : '🎙️'}</ThemedText>
                  <ThemedText style={{ fontSize: 11, fontWeight: '900', color: isListening ? '#fff' : '#000', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {isListening ? 'Écoute...' : 'Dicter'}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => void pickImage(true)}
                  style={{ backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}
                >
                  <ThemedText style={{ fontSize: 16 }}>📷</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => void pickImage(false)}
                  style={{ backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}
                >
                  <ThemedText style={{ fontSize: 16 }}>🖼️</ThemedText>
                </TouchableOpacity>
              </View>
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

            {/* Modal Caméra pour prise de photo Web */}
            <Modal
              visible={cameraVisible}
              animationType="slide"
              onRequestClose={() => {
                if (Platform.OS === 'web') {
                  const videoEl = document.getElementById('webcam-preview') as any;
                  if (videoEl && videoEl._stream) {
                    videoEl._stream.getTracks().forEach((track: any) => track.stop());
                  }
                }
                setCameraVisible(false);
              }}
            >
              <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
                {Platform.OS === 'web' && (
                  <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <video
                      id="webcam-preview"
                      autoPlay
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      ref={(el) => {
                        if (el && cameraVisible) {
                          navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
                            .then((stream) => {
                              el.srcObject = stream;
                              (el as any)._stream = stream;
                            })
                            .catch(() => {
                              Alert.alert("Erreur", "Impossible d'accéder à la webcam.");
                            });
                        }
                      }}
                    />
                  </View>
                )}
                <View style={{ position: 'absolute', bottom: 40, left: 24, right: 24, gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => void takePhoto()}
                    style={{ backgroundColor: '#fff', borderRadius: 50, paddingVertical: 18, alignItems: 'center' }}
                  >
                    <ThemedText style={{ color: '#000', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Prendre la photo</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        const videoEl = document.getElementById('webcam-preview') as any;
                        if (videoEl && videoEl._stream) {
                          videoEl._stream.getTracks().forEach((track: any) => track.stop());
                        }
                      }
                      setCameraVisible(false);
                    }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 50, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fff' }}
                  >
                    <ThemedText style={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Fermer</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

          </ScrollView>
        )}
      </WebContainer>
    </KeyboardAvoidingView>
  );
}
