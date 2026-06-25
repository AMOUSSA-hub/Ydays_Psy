import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { WebContainer } from '@/components/ui/web-container';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useThemePreference, type ThemePreference } from '@/contexts/theme-preference-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMyInviteCode } from '@/lib/repositories';
import { listPatientSummaries } from '@/lib/pro-data';

const PREFS: { key: ThemePreference; short: string }[] = [
  { key: 'system', short: 'Auto' },
  { key: 'light', short: 'Jour' },
  { key: 'dark', short: 'Nuit' },
];

export default function ProProfileScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mainBg = isDark ? '#6B6588' : '#9896D4';

  const { user, signOut } = useAuth();
  const { preference, setPreference } = useThemePreference();
  const [patientCount, setPatientCount] = useState(0);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteCode]);

  const proName = user?.display_name || (user?.email ? user.email.split('@')[0] : 'Praticien');

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setLoading(true);
        try {
          const [list, code] = await Promise.all([listPatientSummaries(), getMyInviteCode()]);
          setPatientCount(list.length);
          setInviteCode(code);
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const onLogout = useCallback(async () => {
    const run = async () => {
      await signOut();
      router.replace('/');
    };
    if (isWeb) {
      if (typeof globalThis !== 'undefined' && 'confirm' in globalThis) {
        if (!globalThis.confirm('Quitter la session ?')) return;
      }
      await run();
      return;
    }
    Alert.alert('Déconnexion', 'Quitter la session ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => void run() },
    ]);
  }, [isWeb, signOut]);

  return (
    <View style={{ flex: 1, backgroundColor: mainBg }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
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
        <View style={{ width: 44 }} />
        <View style={{ borderRadius: 999, backgroundColor: '#F2F2F7', paddingHorizontal: 32, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>Mon Profil</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <WebContainer maxWidth={600} className="px-6">

          {/* Identité */}
          <View style={{ borderRadius: 40, backgroundColor: '#F2F2F7', padding: 28, borderWidth: 1, borderColor: '#f0f0f0', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ height: 88, width: 88, borderRadius: 44, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 40 }}>🩺</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#000', textTransform: 'capitalize' }}>{proName}</Text>
            {user?.email && <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{user.email}</Text>}
            <Text style={{ fontSize: 11, color: '#aaa', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginTop: 6 }}>
              Professionnel de santé
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' }}>
              <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#000' }}>{patientCount}</Text>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#bbb', textTransform: 'uppercase', letterSpacing: 1 }}>Patients</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 22, padding: 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#9896D4' }}>Pro</Text>
                <Text style={{ fontSize: 9, fontWeight: '900', color: '#bbb', textTransform: 'uppercase', letterSpacing: 1 }}>Espace</Text>
              </View>
            </View>
          </View>

          {/* Code d'invitation */}
          <Text style={{ marginBottom: 12, paddingHorizontal: 16, fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 3 }}>
            Mon code d&apos;invitation
          </Text>
          <View style={{ borderRadius: 32, backgroundColor: '#000', padding: 24, marginBottom: 28, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 14, lineHeight: 16 }}>
              Communiquez ce code à vos patients pour qu&apos;ils partagent leur suivi avec vous.
            </Text>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <TouchableOpacity
                  onPress={copyCode}
                  disabled={!inviteCode}
                  activeOpacity={0.7}
                  style={{ backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 28, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <Text style={{ fontSize: 32, fontWeight: '900', letterSpacing: 10, color: '#000' }}>
                    {inviteCode ?? '—'}
                  </Text>
                  {inviteCode && <Text style={{ fontSize: 22 }}>📋</Text>}
                </TouchableOpacity>

                {inviteCode && (
                  <TouchableOpacity
                    onPress={copyCode}
                    activeOpacity={0.8}
                    style={{ marginTop: 14, backgroundColor: copied ? '#22C55E' : 'rgba(255,255,255,0.15)', borderRadius: 50, paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1, borderColor: copied ? '#22C55E' : 'rgba(255,255,255,0.25)' }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 2 }}>
                      {copied ? '✓ Copié !' : 'Copier le code'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Apparence */}
          <Text style={{ marginBottom: 12, paddingHorizontal: 16, fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 3 }}>Apparence</Text>
          <View style={{ borderRadius: 30, backgroundColor: '#F2F2F7', padding: 8, marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 24, padding: 4 }}>
              {PREFS.map((p) => {
                const selected = preference === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => void setPreference(p.key)}
                    className={cn('flex-1 items-center justify-center rounded-[20px] py-3', selected ? 'bg-white shadow-sm' : 'bg-transparent')}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: selected ? '#000' : '#bbb' }}>{p.short}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => void onLogout()}
            style={{ borderRadius: 30, backgroundColor: '#fff', padding: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 }}
          >
            <Text style={{ color: '#DC2626', fontWeight: '900', fontSize: 16 }}>Se déconnecter</Text>
          </TouchableOpacity>

          <Text style={{ marginTop: 40, textAlign: 'center', fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 6 }}>
            Ochitsu Pro v1.0.0
          </Text>
        </WebContainer>
      </ScrollView>
    </View>
  );
}
