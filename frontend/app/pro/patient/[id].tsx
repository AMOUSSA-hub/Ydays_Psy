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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { WebContainer } from '@/components/ui/web-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPatientDetail, MOOD_CONFIG, type PatientDetail } from '@/lib/pro-data';
import { listQuestionnaires } from '@/lib/repositories';
import type { MoodLogRow } from '@/types/database';
import { Image } from 'expo-image';

const DAYS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

interface DayPoint { day: string; num: number; score: number; id: string }

function MoodChart({ data }: { data: DayPoint[] }) {
  const CHART_H = 110;
  const MAX = 5;
  const hasData = data.some((d) => d.score > 0);
  return (
    <View>
      <View style={{ height: CHART_H, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8, position: 'relative' }}>
        {[1, 2, 3, 4, 5].map((lvl) => (
          <View key={lvl} style={{ position: 'absolute', left: 0, right: 0, bottom: (lvl / MAX) * CHART_H - 1, height: 1, backgroundColor: 'rgba(0,0,0,0.05)' }} />
        ))}
        {data.map((d) => {
          const cfg = d.score > 0 ? MOOD_CONFIG[d.score - 1] : null;
          const barH = d.score > 0 ? (d.score / MAX) * CHART_H : 0;
          return (
            <View key={d.id} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_H }}>
              {cfg ? (
                <View style={{ width: 14, height: barH, borderRadius: 7, backgroundColor: cfg.color }} />
              ) : (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.08)' }} />
              )}
              {cfg && (
                <View style={{ position: 'absolute', bottom: barH - 10, width: 20, height: 20, borderRadius: 10, backgroundColor: cfg.fill, borderWidth: 3, borderColor: '#fff' }} />
              )}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '900', color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase' }}>{d.day}</Text>
            <Text style={{ fontSize: 9, color: 'rgba(0,0,0,0.2)', marginTop: 1 }}>{d.num}</Text>
            {d.score > 0 && <Text style={{ fontSize: 14, marginTop: 3 }}>{MOOD_CONFIG[d.score - 1].emoji}</Text>}
          </View>
        ))}
      </View>
      {!hasData && (
        <Text style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'rgba(0,0,0,0.25)', fontStyle: 'italic' }}>
          Aucune humeur enregistrée sur la période
        </Text>
      )}
    </View>
  );
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', textTransform: 'uppercase', paddingHorizontal: 4, marginBottom: 4 }}>
      {children}
    </Text>
  );
}

export default function PatientDetailScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mainBg = isDark ? '#6B6588' : '#9896D4';

  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [quizTitles, setQuizTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [d, questionnaires] = await Promise.all([getPatientDetail(id), listQuestionnaires()]);
      setDetail(d);
      const map: Record<string, string> = {};
      questionnaires.forEach((q) => {
        map[q.id] = q.title;
      });
      setQuizTitles(map);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const moodChartData = useMemo((): DayPoint[] => {
    const byDate = new Map<string, MoodLogRow>();
    (detail?.moodLogs ?? []).forEach((m) => byDate.set(m.logged_date.slice(0, 10), m));
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date();
      dt.setDate(dt.getDate() - (6 - i));
      const iso = dt.toISOString().slice(0, 10);
      const log = byDate.get(iso);
      return { day: DAYS_SHORT[dt.getDay()], num: dt.getDate(), score: log ? log.mood_score : 0, id: log ? log.id : `empty-${i}` };
    });
  }, [detail]);

  const weekAvg = useMemo(() => {
    const scored = moodChartData.filter((d) => d.score > 0);
    return scored.length ? scored.reduce((s, d) => s + d.score, 0) / scored.length : 0;
  }, [moodChartData]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: mainBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: mainBg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#fff', fontWeight: '900', marginBottom: 16 }}>Patient introuvable</Text>
        <TouchableOpacity onPress={() => router.replace('/pro/patients')} style={{ backgroundColor: '#F2F2F7', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 10 }}>
          <Text style={{ fontWeight: '900', color: '#000' }}>Retour</Text>
        </TouchableOpacity>
      </View>
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
        <TouchableOpacity
          onPress={() => router.replace('/pro/patients')}
          activeOpacity={0.7}
          style={{ height: 44, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#F2F2F7' }}
        >
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={{ borderRadius: 999, backgroundColor: '#F2F2F7', paddingHorizontal: 28, paddingVertical: 8, maxWidth: '70%' }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#000' }} numberOfLines={1}>{detail.name}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <WebContainer maxWidth={800} className="px-6">
          <View style={{ gap: 18 }}>

            {/* Patient card */}
            <View style={{ borderRadius: 36, backgroundColor: '#F2F2F7', padding: 24, borderWidth: 1, borderColor: '#f0f0f0', flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ height: 64, width: 64, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#9896D4' }}>{initials(detail.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }} numberOfLines={1}>{detail.name}</Text>
                {detail.email && <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }} numberOfLines={1}>{detail.email}</Text>}
                {detail.followedSince && (
                  <Text style={{ fontSize: 10, color: '#bbb', marginTop: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Suivi depuis le {new Date(detail.followedSince).toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </View>
            </View>

            {/* Mood */}
            <SectionTitle>{"Suivi de l'humeur"}</SectionTitle>
            <View style={{ borderRadius: 36, backgroundColor: '#F2F2F7', padding: 24, borderWidth: 1, borderColor: '#f0f0f0' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 12, color: '#aaa', fontWeight: '700' }}>7 derniers jours</Text>
                {weekAvg > 0 && (
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#000', opacity: 0.5, textTransform: 'uppercase' }}>
                    Moy. {weekAvg.toFixed(1)}/5
                  </Text>
                )}
              </View>
              <MoodChart data={moodChartData} />
            </View>

            {/* Bilans */}
            <SectionTitle>Bilans réalisés</SectionTitle>
            {detail.submissions.length === 0 ? (
              <View style={{ borderRadius: 28, borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)', borderStyle: 'dashed', padding: 28, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontStyle: 'italic' }}>Aucun bilan partagé.</Text>
              </View>
            ) : (
              detail.submissions.map((s) => (
                <View key={s.id} style={{ borderRadius: 28, backgroundColor: '#F2F2F7', padding: 20, borderWidth: 1, borderColor: '#f0f0f0' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: '900', color: '#000', marginRight: 12 }}>
                      {quizTitles[s.questionnaire_id] ?? 'Bilan'}
                    </Text>
                    {s.score !== null && (
                      <View style={{ backgroundColor: s.score >= 2 ? '#FEE2E2' : '#DCFCE7', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: s.score >= 2 ? '#DC2626' : '#16A34A' }}>Score {s.score}</Text>
                      </View>
                    )}
                  </View>
                  {s.summary && (
                    <Text style={{ fontSize: 13, color: '#555', lineHeight: 19, fontStyle: 'italic' }}>{`"${s.summary}"`}</Text>
                  )}
                  <Text style={{ fontSize: 10, color: '#bbb', marginTop: 8, fontWeight: '700', textTransform: 'uppercase' }}>{formatDate(s.created_at)}</Text>
                </View>
              ))
            )}

            {/* Journal partagé */}
            <SectionTitle>Journal partagé</SectionTitle>
            {detail.sharedJournal.length === 0 ? (
              <View style={{ borderRadius: 28, borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)', borderStyle: 'dashed', padding: 28, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontStyle: 'italic', textAlign: 'center' }}>
                  {"Le patient n'a partagé aucune note pour l'instant."}
                </Text>
              </View>
            ) : (
              detail.sharedJournal.map((j) => {
                const mood = j.mood_score ? MOOD_CONFIG[j.mood_score - 1] : null;
                return (
                  <View key={j.id} style={{ borderRadius: 28, backgroundColor: '#F2F2F7', padding: 22, borderWidth: 1, borderColor: '#f0f0f0' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      {mood && (
                        <View style={{ height: 38, width: 38, borderRadius: 14, backgroundColor: mood.color, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <Text style={{ fontSize: 18 }}>{mood.emoji}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#000' }} numberOfLines={1}>{j.title || 'Sans titre'}</Text>
                        <Text style={{ fontSize: 10, color: '#bbb', fontWeight: '700', textTransform: 'uppercase' }}>{formatDate(j.created_at)}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 14, color: '#444', lineHeight: 21, marginBottom: j.image_data ? 12 : 0 }}>{j.body}</Text>
                    {j.image_data && (
                      <Image
                        source={{ uri: j.image_data }}
                        style={{ width: '100%', height: 160, borderRadius: 18 }}
                        contentFit="cover"
                      />
                    )}
                  </View>
                );
              })
            )}

          </View>
        </WebContainer>
      </ScrollView>
    </View>
  );
}
