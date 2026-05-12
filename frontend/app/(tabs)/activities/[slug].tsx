import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebContainer } from '@/components/ui/web-container';
import { listActivities, recordActivitySession } from '@/lib/repositories';
import type { ActivityRow } from '@/types/database';
import { useAuth } from '@/contexts/auth-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');

export default function ActivityDetailScreen() {
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const isWeb = Platform.OS === 'web';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Match Home page colors
  const mainBg = isDark ? '#6B6588' : '#9896D4';
  const cardBg = '#F2F2F7';

  const [activity, setActivity] = useState<ActivityRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const [breathLabel, setBreathLabel] = useState('PRÊT ?');

  // Animation values
  const breathValue = useSharedValue(0);

  const navigation = useNavigation();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listActivities();
      const found = all.find((a) => a.slug === slug);
      if (found) {
        setActivity(found);
        setTimeLeft(found.duration_seconds || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!active || done) return;

      e.preventDefault();

      if (Platform.OS === 'web') {
        if (confirm('Voulez-vous vraiment quitter ? Votre progression sera perdue.')) {
          navigation.dispatch(e.data.action);
        }
      } else {
        Alert.alert(
          'Quitter l\'exercice ?',
          'Voulez-vous vraiment quitter ? Votre progression sera perdue.',
          [
            { text: 'Rester', style: 'cancel', onPress: () => {} },
            {
              text: 'Quitter',
              style: 'destructive',
              onPress: () => navigation.dispatch(e.data.action),
            },
          ]
        );
      }
    });

    return unsubscribe;
  }, [navigation, active, done]);

  useEffect(() => {
    if (active && !done && Platform.OS === 'web') {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [active, done]);

  useEffect(() => {
    let timer: any;
    if (active && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (active && timeLeft === 0) {
      void onFinish();
    }
    return () => clearInterval(timer);
  }, [active, timeLeft]);

  const onFinish = async () => {
    setActive(false);
    setDone(true);
    breathValue.value = withTiming(0);
    if (user && activity) {
      await recordActivitySession(user.id, activity.id);
    }
  };

  const start = () => {
    setDone(false);
    setActive(true);
    // 4s in, 4s out loop for breathing
    breathValue.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  };

  const restart = () => {
    setDone(false);
    setActive(false);
    setBreathLabel('PRÊT ?');
    setTimeLeft(activity?.duration_seconds || 0);
    breathValue.value = 0;
  };

  useAnimatedReaction(
    () => breathValue.value,
    (value) => {
      if (!active) {
        if (breathLabel !== 'PRÊT ?') runOnJS(setBreathLabel)('PRÊT ?');
        return;
      }
      const newLabel = value > 0.5 ? 'EXPIREZ' : 'INSPIREZ';
      if (newLabel !== breathLabel) {
        runOnJS(setBreathLabel)(newLabel);
      }
    },
    [active, breathLabel]
  );

  const animatedCircleStyle = useAnimatedStyle(() => {
    const scale = interpolate(breathValue.value, [0, 1], [0.8, 1.3]);
    const opacity = interpolate(breathValue.value, [0, 1], [0.4, 0.8]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: mainBg }}>
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  if (!activity) return null;

  return (
    <View className="flex-1" style={{ backgroundColor: mainBg }}>
      <WebContainer maxWidth={800} className="flex-1 px-6 pt-0 pb-38">
        {/* Header - Aligned with Home & Quiz */}
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
            onPress={() => router.replace('/activities')} 
            className="h-11 w-11 items-center justify-center rounded-full shadow-sm bg-[#F2F2F7]"
          >
            <IconSymbol name="chevron.left" size={24} color="#000" />
          </TouchableOpacity>
          <View className="rounded-full px-8 py-3 shadow-sm flex-1 mx-4 bg-[#F2F2F7]">
            <ThemedText className="font-black text-black text-[12px] tracking-tight uppercase text-center" numberOfLines={1}>{activity.title}</ThemedText>
          </View>
          <View className="w-11" />
        </View>

        {done ? (
          <View className="flex-1 items-center justify-start pt-0">
            <View className="w-full rounded-[45px] p-10 shadow-sm items-center border border-neutral-100" style={{ backgroundColor: cardBg }}>
              <ThemedText className="text-6xl mb-4">🌿</ThemedText>
              <ThemedText className="text-3xl font-black text-black text-center mb-2 tracking-tight">Bravo !</ThemedText>
              <ThemedText className="text-lg text-neutral-600 text-center mb-6 leading-7">
                Vous avez pris du temps pour vous. Ressentez-vous les bienfaits ?
              </ThemedText>
              <TouchableOpacity 
                onPress={() => router.push('/home')} 
                className="bg-black w-full py-5 rounded-full shadow-lg"
              >
                <ThemedText className="text-white text-center font-black tracking-widest uppercase">RETOUR À L'ACCUEIL</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={restart} 
                className="mt-4 w-full py-5 rounded-full border-2 border-black"
              >
                <ThemedText className="text-black text-center font-black tracking-widest uppercase">RECOMMENCER</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-start pt-0">
            {activity.type === 'breathing' && (
              <View className="relative items-center justify-center mb-12">
                <Animated.View 
                  className="absolute h-64 w-64 rounded-full bg-white/40"
                  style={animatedCircleStyle}
                />
                <View className="h-56 w-56 rounded-full bg-white items-center justify-center shadow-xl border border-white">
                  <ThemedText className="text-2xl font-black text-black tracking-tighter uppercase">
                    {breathLabel}
                  </ThemedText>
                </View>
              </View>
            )}

            <ThemedText className="text-center text-white font-medium text-xl mb-6 px-6 leading-8 max-w-sm">
              {activity.body}
            </ThemedText>

            {activity.duration_seconds && (
              <View className="mb-6 items-center">
                <ThemedText className="text-white/70 font-black tracking-widest text-[10px] uppercase mb-1">TEMPS RESTANT</ThemedText>
                <View className="rounded-full bg-white/20 px-8 py-3 border border-white/30">
                  <ThemedText className="text-5xl font-black text-white tracking-tighter">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </ThemedText>
                </View>
              </View>
            )}

            {!active && (
              <TouchableOpacity 
                onPress={start}
                className="bg-black px-16 py-6 rounded-full shadow-2xl active:scale-95"
              >
                <ThemedText className="text-white font-black text-xl tracking-widest uppercase">COMMENCER</ThemedText>
              </TouchableOpacity>
            )}
            
            {active && (
              <View className="items-center">
                <TouchableOpacity 
                  onPress={() => setActive(false)}
                  className="px-10 py-3 rounded-full bg-white/10 border border-white/20"
                >
                  <ThemedText className="text-white font-black text-sm uppercase tracking-widest">PAUSE</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={restart}
                  className="mt-4 px-10 py-3 rounded-full bg-white/5 border border-white/10"
                >
                  <ThemedText className="text-white/60 font-black text-[10px] uppercase tracking-widest">Recommencer l'exercice</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </WebContainer>
    </View>
  );
}
