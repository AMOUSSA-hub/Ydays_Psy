import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { WebContainer } from '@/components/ui/web-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, type AppRole } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const { login, register } = useAuth();

  const params = useLocalSearchParams<{ role?: string }>();
  const role: AppRole = params.role === 'professional' ? 'professional' : 'patient';
  const isPro = role === 'professional';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);

  // Mesure la hauteur réelle du clavier (fiable partout, y compris Expo Go
  // et avec edge-to-edge où KeyboardAvoidingView est défaillant sur Android).
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  async function submit() {
    if (loading) return;
    setError(null);

    if (!email.trim() || !password) {
      setError('Email et mot de passe requis.');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    setLoading(true);
    const result =
      mode === 'login'
        ? await login(email.trim(), password)
        : await register(email.trim(), password, role, displayName.trim() || undefined);
    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }
    // L'écran d'accueil redirige vers le bon espace selon le rôle réel du compte.
    router.replace('/');
  }

  return (
    <View className="flex-1 bg-[#9896D4]">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          marginTop: isWeb ? 24 : insets.top + 16,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 24,
          height: 44,
        }}
      >
        <TouchableOpacity
          onPress={() => router.replace('/')}
          activeOpacity={0.7}
          style={{ height: 44, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#F2F2F7' }}
        >
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: kbHeight + 32 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <WebContainer maxWidth={460} className="w-full items-center px-6">
          {/* Badge espace */}
          <View
            className="rounded-full px-6 py-2 mb-4"
            style={{ backgroundColor: isPro ? '#000' : '#F2F2F7' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: isPro ? '#fff' : '#000' }}>
              {isPro ? '🩺 Espace Professionnel' : 'Espace Patient'}
            </Text>
          </View>

          <Text className="text-white text-3xl font-black tracking-tight mb-1">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </Text>
          <Text className="text-white/60 text-center text-sm font-medium mb-8">
            {mode === 'login' ? 'Ravi de vous revoir sur Ochitsu.' : 'Quelques secondes pour démarrer.'}
          </Text>

          {/* Carte formulaire */}
          <View className="w-full rounded-[36px] bg-[#F2F2F7] p-6 shadow-sm border border-neutral-100">
            {/* Toggle login/register */}
            <View className="flex-row bg-white/60 rounded-[20px] p-1 mb-6">
              {(['login', 'register'] as const).map((m) => {
                const selected = mode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => { setMode(m); setError(null); }}
                    className={cn('flex-1 items-center justify-center rounded-[16px] py-3', selected ? 'bg-white shadow-sm' : 'bg-transparent')}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: selected ? '#000' : '#bbb' }}>
                      {m === 'login' ? 'Connexion' : 'Inscription'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {mode === 'register' && (
              <TextInput
                placeholder="Nom affiché (optionnel)"
                placeholderTextColor="#00000044"
                value={displayName}
                onChangeText={setDisplayName}
                className="bg-white rounded-2xl px-5 py-4 mb-3 text-base text-black"
              />
            )}

            <TextInput
              placeholder="Email"
              placeholderTextColor="#00000044"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="bg-white rounded-2xl px-5 py-4 mb-3 text-base text-black"
            />
            <TextInput
              placeholder="Mot de passe"
              placeholderTextColor="#00000044"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="bg-white rounded-2xl px-5 py-4 text-base text-black"
            />

            {error && (
              <View className="mt-4 rounded-2xl bg-red-50 px-4 py-3">
                <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={submit}
              disabled={loading}
              activeOpacity={0.9}
              className="mt-6 h-14 rounded-2xl bg-black items-center justify-center shadow-lg"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, fontSize: 14 }}>
                  {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </WebContainer>
      </ScrollView>
    </View>
  );
}
