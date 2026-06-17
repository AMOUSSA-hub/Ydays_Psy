import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { WebContainer } from '@/components/ui/web-container';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getMyProfessional,
  linkProfessional,
  unlinkProfessional,
  type LinkedProfessional,
} from '@/lib/repositories';

export default function ProfileScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mainBg = isDark ? '#6B6588' : '#9896D4';

  const [pro, setPro] = useState<LinkedProfessional | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPro(await getMyProfessional());
    } catch {
      setPro(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function onLink() {
    if (busy || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const linked = await linkProfessional(code.trim());
      setPro(linked);
      setCode('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Liaison impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function onUnlink() {
    if (!pro) return;
    const run = async () => {
      setBusy(true);
      try {
        await unlinkProfessional(pro.id);
        setPro(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur.');
      } finally {
        setBusy(false);
      }
    };
    if (isWeb) {
      if (typeof globalThis !== 'undefined' && 'confirm' in globalThis) {
        if (!globalThis.confirm('Ne plus partager vos données avec ce professionnel ?')) return;
      }
      await run();
      return;
    }
    Alert.alert('Révoquer le partage', 'Ne plus partager vos données avec ce professionnel ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Révoquer', style: 'destructive', onPress: () => void run() },
    ]);
  }

  const proName = pro?.display_name || pro?.email || '';

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
        <View style={{ borderRadius: 999, backgroundColor: '#F2F2F7', paddingHorizontal: 40, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>Mon Profil</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <WebContainer maxWidth={600} className="px-6">

          {/* Identité */}
          <View style={{ borderRadius: 40, backgroundColor: '#F2F2F7', padding: 28, borderWidth: 1, borderColor: '#f0f0f0', alignItems: 'center', marginBottom: 28 }}>
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 40 }}>🧑</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#000' }}>
              {user?.display_name || 'Mon compte'}
            </Text>
            {user?.email && <Text style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{user.email}</Text>}
          </View>

          {/* Mon professionnel de santé */}
          <Text style={{ marginBottom: 12, paddingHorizontal: 16, fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 3 }}>
            Mon professionnel de santé
          </Text>

          <View style={{ borderRadius: 32, backgroundColor: '#F2F2F7', padding: 24, borderWidth: 1, borderColor: '#f0f0f0' }}>
            {loading ? (
              <ActivityIndicator color="#9896D4" />
            ) : pro ? (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ height: 52, width: 52, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Text style={{ fontSize: 24 }}>🩺</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#000' }} numberOfLines={1}>{proName}</Text>
                    <Text style={{ fontSize: 11, color: '#22C55E', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                      Partage actif
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: '#888', lineHeight: 18, marginTop: 16 }}>
                  Votre humeur quotidienne, vos bilans et les notes que vous marquez comme partagées sont visibles par ce professionnel.
                </Text>
                <TouchableOpacity
                  onPress={() => void onUnlink()}
                  disabled={busy}
                  style={{ marginTop: 18, borderRadius: 16, borderWidth: 2, borderColor: '#FECACA', paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: '#DC2626', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Révoquer le partage</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 16 }}>
                  Saisissez le code d&apos;invitation fourni par votre psychologue ou psychiatre pour partager votre suivi avec lui.
                </Text>
                <TextInput
                  placeholder="Code (ex. K7P2QM)"
                  placeholderTextColor="#00000033"
                  value={code}
                  onChangeText={(t) => setCode(t.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                  style={{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14, fontSize: 20, fontWeight: '900', letterSpacing: 6, textAlign: 'center', color: '#000' }}
                />
                {error && (
                  <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 10 }}>{error}</Text>
                )}
                <TouchableOpacity
                  onPress={() => void onLink()}
                  disabled={busy || code.length < 4}
                  activeOpacity={0.9}
                  style={{ marginTop: 16, borderRadius: 16, backgroundColor: '#000', paddingVertical: 16, alignItems: 'center', opacity: code.length < 4 ? 0.4 : 1 }}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 }}>Relier mon médecin</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

        </WebContainer>
      </ScrollView>
    </View>
  );
}
