import React from 'react';
import { ScrollView, View, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cn } from '@/lib/utils';
import { WebContainer } from '@/components/ui/web-container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();

  const bgColor = isDark ? '#4a4370' : '#F2F2F7';
  const cardBg = isDark ? '#5C5C62' : '#FFFFFF';

  return (
    <View className="flex-1" style={{ backgroundColor: bgColor }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View 
        style={{ 
          marginTop: isWeb ? 24 : insets.top + 16, 
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          height: 44,
        }}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="h-11 w-11 items-center justify-center rounded-full bg-[#F2F2F7]/20 shadow-sm"
        >
          <IconSymbol name="chevron.left" size={24} color={isDark ? "#D1D1D6" : "#6B5B95"} />
        </TouchableOpacity>
        <ThemedText type="title" lightColor="#4B3F72" darkColor="#FFFFFF">Confidentialité</ThemedText>
        <View className="w-11" />
      </View>

      <ScrollView className="flex-1 px-6">
        <WebContainer maxWidth={800} className="gap-6">
          <View className="rounded-[28px] p-6 shadow-sm" style={{ backgroundColor: cardBg }}>
            <ThemedText className="mb-3 text-lg font-bold" lightColor="#4B3F72" darkColor="#FFFFFF">
              Notre Engagement
            </ThemedText>
            <ThemedText className="text-sm leading-6 opacity-80" lightColor="#2D2347" darkColor="#D1D1D6">
              Ochitsu est conçu pour vous accompagner dans le bien-être mental. Les informations que vous
              saisissez (journal, humeur, questionnaires) sont destinées à vous aider à prendre conscience de
              votre évolution. Elles ne remplacent en aucun cas un avis médical ou psychologique.
            </ThemedText>
          </View>

          <View className="rounded-[28px] p-6 shadow-sm" style={{ backgroundColor: cardBg }}>
            <ThemedText className="mb-3 text-lg font-bold" lightColor="#4B3F72" darkColor="#FFFFFF">
              Mode anonyme
            </ThemedText>
            <ThemedText className="text-sm leading-6 opacity-80" lightColor="#2D2347" darkColor="#D1D1D6">
              Vous pouvez utiliser l’application sans créer de compte classique : un mode invité limite
              certaines synchronisations mais permet de tester les fonctionnalités en local ou avec un compte
              anonyme sécurisé. Vos données vous appartiennent.
            </ThemedText>
          </View>

          <View className="rounded-[28px] p-6 shadow-sm" style={{ backgroundColor: cardBg }}>
            <ThemedText className="mb-3 text-lg font-bold" lightColor="#4B3F72" darkColor="#FFFFFF">
              Données et sécurité
            </ThemedText>
            <ThemedText className="text-sm leading-6 opacity-80" lightColor="#2D2347" darkColor="#D1D1D6">
              Les données sont stockées de manière sécurisée. Si vous utilisez un compte, elles sont synchronisées
              avec Supabase via des règles d'accès strictes. Sans compte, elles restent sur votre appareil.
            </ThemedText>
          </View>

          <View className="rounded-[28px] bg-red-50 p-6 border border-red-100 shadow-sm">
            <ThemedText className="mb-3 text-lg font-bold text-red-900">
              Urgences
            </ThemedText>
            <ThemedText className="text-sm leading-6 text-red-800 opacity-90">
              En cas de détresse immédiate ou de pensées suicidaires, contactez le 3114 ou le 112.
              Ochitsu n'est pas un service d'urgence médicale.
            </ThemedText>
          </View>
        </WebContainer>
      </ScrollView>
    </View>
  );
}
