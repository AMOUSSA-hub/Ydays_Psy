import React, { useCallback } from 'react';
import { Alert, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { router, useRouter } from 'expo-router';
import { cn } from '@/lib/utils';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WebContainer } from '@/components/ui/web-container';
import { useAuth } from '@/contexts/auth-context';
import { useThemePreference, type ThemePreference } from '@/contexts/theme-preference-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const options = {
  title: 'Réglages',
  headerShown: false,
};

const PREFS: { key: ThemePreference; label: string; short: string; hint?: string }[] = [
  { key: 'system', label: 'Automatique', short: 'Auto', hint: 'Suit votre appareil' },
  { key: 'light', label: 'Jour', short: 'Jour' },
  { key: 'dark', label: 'Nuit', short: 'Nuit' },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isWeb = Platform.OS === 'web';
  const nav = useRouter();
  const { signOut, user } = useAuth();
  const { preference, setPreference } = useThemePreference();
  const insets = useSafeAreaInsets();
  const mainBg = isDark ? '#6B6588' : '#9896D4';

  const goBack = useCallback(() => {
    router.replace('/home');
  }, []);

  const onLogout = useCallback(async () => {
    const run = async () => {
      await signOut();
      router.replace('/');
    };

    if (isWeb) {
      if (typeof globalThis !== 'undefined' && 'confirm' in globalThis) {
        const ok = globalThis.confirm('Quitter la session ?');
        if (!ok) return;
      }
      await run();
      return;
    }

    Alert.alert('Déconnexion', 'Quitter la session ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: () => void run(),
      },
    ]);
  }, [isWeb, signOut]);

  return (
    <View className="flex-1" style={{ backgroundColor: mainBg }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 20,
          paddingHorizontal: isWeb ? 0 : 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <WebContainer maxWidth={600}>
          {/* Header */}
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
              onPress={goBack} 
              className="h-11 w-11 items-center justify-center rounded-full bg-[#F2F2F7] shadow-sm"
            >
              <IconSymbol name="chevron.left" size={24} color="#000" />
            </TouchableOpacity>
            <View className="bg-[#F2F2F7] px-8 py-2 rounded-full shadow-sm">
              <ThemedText className="text-2xl font-black text-black">Réglages</ThemedText>
            </View>
            <View className="w-11" />
          </View>

          {/* Profile Card */}
          <View className="mb-10 rounded-[40px] bg-[#F2F2F7] p-8 shadow-sm items-center border border-neutral-100">
            <View className="h-20 w-20 rounded-full bg-white items-center justify-center mb-4 shadow-sm">
              <ThemedText className="text-3xl">👤</ThemedText>
            </View>
            <ThemedText className="text-xl font-black text-black mb-1">
              {user?.email || 'Utilisateur'}
            </ThemedText>
            <ThemedText className="text-[10px] text-neutral-400 uppercase tracking-widest font-black">
              ID: {user?.id?.slice(0, 8)}...
            </ThemedText>
          </View>

          {/* Settings Groups */}
          <View className="gap-8">
            <View>
              <ThemedText className="mb-4 px-4 text-xs font-black text-white/60 uppercase tracking-[3px]">Apparence</ThemedText>
              <View className="rounded-[30px] bg-[#F2F2F7] p-2 border border-neutral-50 shadow-sm">
                <View className="flex-row p-1 bg-white/50 rounded-[24px]">
                  {PREFS.map((p) => {
                    const selected = preference === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        onPress={() => void setPreference(p.key)}
                        className={cn(
                          'flex-1 items-center justify-center rounded-[20px] py-3 transition-all',
                          selected ? "bg-white shadow-sm" : "bg-transparent"
                        )}
                      >
                        <ThemedText className={cn(
                          "text-xs font-black uppercase tracking-widest",
                          selected ? "text-black" : "text-neutral-400"
                        )}>
                          {p.short}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <View>
              <ThemedText className="mb-4 px-4 text-xs font-black text-white/60 uppercase tracking-[3px]">Confidentialité & Aide</ThemedText>
              <View className="rounded-[30px] bg-[#F2F2F7] shadow-sm overflow-hidden border border-neutral-50">
                {[
                  { label: "Politique de confidentialité", icon: "🔒", route: "/privacy" },
                  { label: "Centre d'aide", icon: "❓", route: "/phone" },
                  { label: "À propos d'Ochitsu", icon: "✨", route: null },
                ].map((item, i) => (
                  <TouchableOpacity 
                    key={i}
                    onPress={() => item.route && router.push(item.route as any)}
                    className={cn("flex-row items-center justify-between p-6", i !== 2 && "border-b border-neutral-100")}
                  >
                    <View className="flex-row items-center gap-4">
                      <ThemedText className="text-xl">{item.icon}</ThemedText>
                      <ThemedText className="text-base font-bold text-black">{item.label}</ThemedText>
                    </View>
                    <ThemedText className="text-neutral-300 font-black text-xl">→</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => void onLogout()}
              className="mt-4 rounded-[30px] bg-white border border-red-50 p-6 flex-row items-center justify-center gap-3 shadow-md active:bg-red-50"
            >
              <ThemedText className="text-red-600 font-black text-lg">Se déconnecter</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText className="mt-12 text-center text-[10px] font-black text-white/40 uppercase tracking-[6px]">
            Ochitsu v1.0.0
          </ThemedText>
        </WebContainer>
      </ScrollView>
    </View>
  );
}
