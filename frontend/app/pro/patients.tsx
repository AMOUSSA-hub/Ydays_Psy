import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { WebContainer } from '@/components/ui/web-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { listPatientSummaries, MOOD_CONFIG, type PatientSummary } from '@/lib/pro-data';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

function TrendBadge({ trend }: { trend: PatientSummary['trend'] }) {
  if (!trend) return null;
  const map = {
    up: { label: 'En hausse', color: '#22C55E', arrow: '↑' },
    down: { label: 'En baisse', color: '#EF4444', arrow: '↓' },
    flat: { label: 'Stable', color: '#9896D4', arrow: '→' },
  } as const;
  const c = map[trend];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={{ color: c.color, fontWeight: '900', fontSize: 13 }}>{c.arrow}</Text>
      <Text style={{ color: c.color, fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>
        {c.label}
      </Text>
    </View>
  );
}

export default function PatientsScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mainBg = isDark ? '#6B6588' : '#9896D4';

  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPatients(await listPatientSummaries());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.email ?? '').toLowerCase().includes(q)
    );
  }, [patients, query]);

  const alertCount = useMemo(() => patients.filter((p) => p.needsAttention).length, [patients]);

  function renderCard(p: PatientSummary) {
    const mood = p.lastMoodScore ? MOOD_CONFIG[p.lastMoodScore - 1] : null;
    return (
      <TouchableOpacity
        key={p.id}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/pro/patient/[id]', params: { id: p.id } })}
        style={{ borderRadius: 36, backgroundColor: '#F2F2F7', padding: 22, borderWidth: 1, borderColor: '#f0f0f0' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Avatar */}
          <View style={{ height: 60, width: 60, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 5 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#9896D4' }}>{initials(p.name)}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: '#000' }} numberOfLines={1}>{p.name}</Text>
              {p.isDemo && (
                <View style={{ backgroundColor: '#EDE9FE', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 8, fontWeight: '900', color: '#7C3AED', textTransform: 'uppercase' }}>Démo</Text>
                </View>
              )}
            </View>
            {p.email && (
              <Text style={{ fontSize: 11, color: '#aaa', marginTop: 2 }} numberOfLines={1}>{p.email}</Text>
            )}
            <View style={{ marginTop: 6 }}>
              <TrendBadge trend={p.trend} />
            </View>
          </View>

          {/* Last mood */}
          <View style={{ alignItems: 'center', marginLeft: 8 }}>
            {mood ? (
              <View style={{ height: 50, width: 50, borderRadius: 18, backgroundColor: mood.color, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>{mood.emoji}</Text>
              </View>
            ) : (
              <View style={{ height: 50, width: 50, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, color: '#ccc' }}>—</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer stats */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#000' }}>{p.weekAvg !== null ? `${p.weekAvg.toFixed(1)}/5` : '—'}</Text>
            <Text style={{ fontSize: 8, fontWeight: '900', color: '#bbb', textTransform: 'uppercase', letterSpacing: 1 }}>Moy. 7j</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#000' }}>{p.sharedJournalCount}</Text>
            <Text style={{ fontSize: 8, fontWeight: '900', color: '#bbb', textTransform: 'uppercase', letterSpacing: 1 }}>Notes</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#000' }}>{p.submissionsCount}</Text>
            <Text style={{ fontSize: 8, fontWeight: '900', color: '#bbb', textTransform: 'uppercase', letterSpacing: 1 }}>Bilans</Text>
          </View>
          {p.needsAttention && (
            <View style={{ backgroundColor: '#FEE2E2', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#DC2626', textTransform: 'uppercase' }}>⚠ À suivre</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

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
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>Mes Patients</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <WebContainer maxWidth={800} className="flex-1 px-6">
        {/* Summary row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
          <View style={{ flex: 1, backgroundColor: '#F2F2F7', borderRadius: 28, padding: 18, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#000' }}>{patients.length}</Text>
            <Text style={{ fontSize: 9, fontWeight: '900', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>Patients suivis</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: alertCount > 0 ? '#DC2626' : '#F2F2F7', borderRadius: 28, padding: 18, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: alertCount > 0 ? '#fff' : '#000' }}>{alertCount}</Text>
            <Text style={{ fontSize: 9, fontWeight: '900', color: alertCount > 0 ? 'rgba(255,255,255,0.8)' : '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>À surveiller</Text>
          </View>
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 20, paddingVertical: 12, marginBottom: 18 }}>
          <IconSymbol name="magnifyingglass" size={20} color="#00000044" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Rechercher un patient"
            placeholderTextColor="#00000044"
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, fontSize: 16, fontWeight: '500', color: '#000' }}
          />
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 16, paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => renderCard(item)}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🗂️</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontStyle: 'italic', textAlign: 'center' }}>
                  {query ? 'Aucun patient ne correspond.' : "Aucun patient pour le moment."}
                </Text>
              </View>
            }
          />
        )}
      </WebContainer>
    </View>
  );
}
