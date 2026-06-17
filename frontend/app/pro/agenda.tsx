import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { WebContainer } from '@/components/ui/web-container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { listUpcomingAppointments, type UpcomingAppointment } from '@/lib/pro-data';

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === tomorrow.toDateString()) return 'Demain';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function ProAgendaScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mainBg = isDark ? '#6B6588' : '#9896D4';

  const [items, setItems] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listUpcomingAppointments());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  // Regroupe les rendez-vous par jour.
  const grouped = useMemo(() => {
    const map = new Map<string, UpcomingAppointment[]>();
    for (const it of items) {
      const key = dayLabel(it.date);
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [items]);

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
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>Rendez-vous</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <WebContainer maxWidth={800} className="px-6">
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          ) : items.length === 0 ? (
            <View style={{ borderRadius: 40, borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)', borderStyle: 'dashed', padding: 48, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📅</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', fontSize: 12 }}>
                Aucun rendez-vous prévu
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', textAlign: 'center', marginTop: 10, fontSize: 12 }}>
                {"Les rappels d'appel programmés par vos patients apparaîtront ici."}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 24 }}>
              {grouped.map(([label, appts]) => (
                <View key={label} style={{ gap: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff', textTransform: 'capitalize', paddingHorizontal: 4 }}>{label}</Text>
                  {appts.map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      activeOpacity={0.9}
                      onPress={() => router.push({ pathname: '/pro/patient/[id]', params: { id: a.patientId } })}
                      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 32, padding: 18, borderWidth: 1, borderColor: '#f0f0f0' }}
                    >
                      <View style={{ height: 52, width: 52, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#9896D4' }}>{initials(a.patientName)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '900', color: '#000' }} numberOfLines={1}>{a.patientName}</Text>
                        <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }} numberOfLines={1}>{a.title}</Text>
                      </View>
                      <View style={{ backgroundColor: '#000', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#22C55E' }}>
                          {new Date(a.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}
        </WebContainer>
      </ScrollView>
    </View>
  );
}
