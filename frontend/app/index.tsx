import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  View,
  StatusBar,
  Image,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { WebContainer } from '@/components/ui/web-container';
import { useAuth, type AppRole } from '@/contexts/auth-context';

export default function WelcomeScreen() {
  const { user, initialized, role } = useAuth();
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    // Si une session existe déjà, on va directement vers le bon espace.
    if (initialized && user && role) {
      router.replace(role === 'professional' ? '/pro/patients' : '/(tabs)/home');
    }
  }, [initialized, user, role]);

  function chooseSpace(next: AppRole) {
    router.push({ pathname: '/auth', params: { role: next } });
  }

  if (!initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-[#9896D4]">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // Redirection en cours
  if (user && role) {
    return null;
  }

  return (
    <View className="flex-1 bg-[#9896D4] items-center justify-center">
      <StatusBar barStyle="light-content" />

      <WebContainer maxWidth={isWeb ? 520 : 440} className="flex-1 w-full items-center justify-center px-6">
        {/* Logo */}
        <Image
          source={require('@/assets/images/Ochitsu.png')}
          style={{ width: 130, height: 130, resizeMode: 'contain' }}
        />

        {/* App Name */}
        <ThemedText className="text-white text-5xl font-black tracking-tighter mt-2 mb-2">
          Ochitsu
        </ThemedText>

        {/* Tagline */}
        <ThemedText className="text-white/70 text-center text-base font-medium mb-10">
          Choisissez votre espace pour commencer.
        </ThemedText>

        {/* Choix de l'espace */}
        <View className="w-full gap-5">
          {/* Patient */}
          <TouchableOpacity
            onPress={() => chooseSpace('patient')}
            activeOpacity={0.9}
            className="w-full rounded-[40px] bg-[#F2F2F7] p-7 shadow-sm border border-neutral-100 flex-row items-center"
          >
            <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-white mr-5 shadow-sm overflow-hidden">
              <Image
                source={require('@/assets/images/figma/monster.png')}
                style={{ width: 56, height: 56, resizeMode: 'contain' }}
              />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-black text-black tracking-tight mb-1">Patient</Text>
              <Text className="text-sm text-neutral-500 leading-5">
                Suivi quotidien, journal, bilans et bien-être.
              </Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-full bg-white/60 border border-neutral-200 ml-2">
              <Text className="text-black text-2xl font-black">→</Text>
            </View>
          </TouchableOpacity>

          {/* Professionnel */}
          <TouchableOpacity
            onPress={() => chooseSpace('professional')}
            activeOpacity={0.9}
            className="w-full rounded-[40px] bg-black p-7 shadow-sm flex-row items-center"
          >
            <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-white mr-5 shadow-sm">
              <Text style={{ fontSize: 40 }}>🩺</Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-black text-white tracking-tight mb-1">Professionnel</Text>
              <Text className="text-sm text-white/60 leading-5">
                Suivez vos patients et leurs données partagées.
              </Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-full bg-white/15 border border-white/20 ml-2">
              <Text className="text-white text-2xl font-black">→</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ThemedText className="mt-10 text-center text-[10px] font-black text-white/40 uppercase tracking-[4px]">
          Ochitsu v1.0.0
        </ThemedText>
      </WebContainer>
    </View>
  );
}
