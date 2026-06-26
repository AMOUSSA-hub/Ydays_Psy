import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  StatusBar,
  Modal,
  Text,
} from 'react-native';
import { WebContainer } from '@/components/ui/web-container';
import { useFocusEffect } from 'expo-router';
import {
  listMoodLogs,
  upsertMoodLog,
  listReminders,
  saveReminder,
  deleteReminder,
} from '@/lib/repositories';
import type { MoodLogRow, ReminderRow } from '@/types/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { scheduleReminderNotification, cancelScheduledNotification } from '@/lib/notifications';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const DURATIONS = [5, 10, 15, 30, 60];

const RITUALS = [
  { id: 'zen', title: 'Rituel Zen', emoji: '🧘', body: 'Moment de respiration profonde.' },
  { id: 'nuit', title: 'Rituel Nuit', emoji: '🌙', body: 'Gratitude et repos.' },
  { id: 'matin', title: 'Rituel Matin', emoji: '☀️', body: 'Eveil et energie.' },
];

const MOOD_CONFIG = [
  { emoji: '😢', label: 'Difficile', color: '#FECACA', fill: '#EF4444' },
  { emoji: '🙁', label: 'Pas top', color: '#FED7AA', fill: '#F97316' },
  { emoji: '😐', label: 'Neutre', color: '#FEF08A', fill: '#EAB308' },
  { emoji: '🙂', label: 'Bien', color: '#BBF7D0', fill: '#22C55E' },
  { emoji: '😊', label: 'Super !', color: '#BAE6FD', fill: '#06B6D4' },
];

// ─── Mood Chart ───────────────────────────────────────────────────────────────
interface DayPoint { day: string; score: number; num: number; id: string }

function MoodChart({ data }: { data: DayPoint[] }) {
  const CHART_H = 110;
  const MAX_SCORE = 5;
  const hasData = data.some(d => d.score > 0);

  return (
    <View>
      <View style={{ height: CHART_H, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8, position: 'relative' }}>
        {[1, 2, 3, 4, 5].map(lvl => (
          <View key={lvl} style={{ position: 'absolute', left: 0, right: 0, bottom: (lvl / MAX_SCORE) * CHART_H - 1, height: 1, backgroundColor: 'rgba(0,0,0,0.05)' }} />
        ))}

        {data.map((d, i) => {
          const cfg = d.score > 0 ? MOOD_CONFIG[d.score - 1] : null;
          const barH = d.score > 0 ? (d.score / MAX_SCORE) * CHART_H : 0;
          return (
            <View key={d.id} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_H }}>
              {cfg ? (
                <View style={{ width: 14, height: barH, borderRadius: 7, backgroundColor: cfg.color }} />
              ) : (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.08)' }} />
              )}
              {cfg && (
                <View style={{
                  position: 'absolute', bottom: barH - 10,
                  width: 20, height: 20, borderRadius: 10,
                  backgroundColor: cfg.fill,
                  borderWidth: 3, borderColor: '#fff',
                  elevation: 4,
                  shadowColor: cfg.fill, shadowOpacity: 0.5, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
                }} />
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
          Enregistre ton humeur pour voir ton evolution
        </Text>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AgendaScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [moods, setMoods] = useState<MoodLogRow[]>([]);
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackEmoji, setFeedbackEmoji] = useState('');

  const [selectedRitual, setSelectedRitual] = useState<typeof RITUALS[0] | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [hour, setHour] = useState(new Date().getHours());
  const [minute, setMinute] = useState(Math.ceil(new Date().getMinutes() / 5) * 5 % 60);
  const [dayOffset, setDayOffset] = useState(0);
  const [duration, setDuration] = useState(15);

  const mainBg = isDark ? '#6B6588' : '#9896D4';

  const load = useCallback(async () => {
    if (!user) return;
    const [m, r] = await Promise.all([listMoodLogs(user.id), listReminders(user.id)]);
    setMoods(m);
    setReminders(r);
  }, [user]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const moodData = useMemo((): DayPoint[] => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const iso = d.toISOString().slice(0, 10);
      const log = moods.find(m => m.logged_date.slice(0, 10) === iso);
      return { day: DAYS_SHORT[d.getDay()], num: d.getDate(), score: log ? log.mood_score : 0, id: log ? log.id : `empty-${i}` };
    });
  }, [moods]);

  const sortedReminders = useMemo(
    () => [...reminders].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [reminders]
  );

  const latestMood = useMemo(() => {
    if (!moods.length) return null;
    return [...moods].sort((a, b) => new Date(b.logged_date).getTime() - new Date(a.logged_date).getTime())[0];
  }, [moods]);

  const weekAvg = useMemo(() => {
    const scored = moodData.filter(d => d.score > 0);
    return scored.length ? scored.reduce((s, d) => s + d.score, 0) / scored.length : 0;
  }, [moodData]);

  async function addMood(score: number) {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      await upsertMoodLog(user.id, today, score);
      const cfg = MOOD_CONFIG[score - 1];
      setFeedbackEmoji(cfg.emoji);
      if (score >= 4) {
        setFeedbackMsg("Ochitsu est content de te voir sourire !");
      } else if (score === 3) {
        setFeedbackMsg("Merci d'avoir partage. Chaque journee compte.");
      } else {
        setFeedbackMsg("Ochitsu est la pour toi. Tu as le droit de ne pas aller bien.");
      }
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 3500);
      void load();
    } catch {
      Alert.alert("Erreur", "Impossible d'enregistrer.");
    }
  }

  async function scheduleRitual() {
    if (!user || !selectedRitual) return;
    const scheduled = new Date();
    scheduled.setDate(scheduled.getDate() + dayOffset);
    scheduled.setHours(hour, minute, 0, 0);
    try {
      const row = await saveReminder(user.id, {
        title: selectedRitual.title,
        body: `${selectedRitual.body} (${duration}min)`,
        scheduled_at: scheduled.toISOString(),
        enabled: true,
      });
      const nid = await scheduleReminderNotification(row.title, row.body ?? undefined, scheduled);
      if (nid) await saveReminder(user.id, { ...row, notification_id: nid });
      setShowScheduleModal(false);
      void load();
    } catch {
      Alert.alert("Erreur", "Impossible de programmer.");
    }
  }

  async function removeReminder(id: string, nid?: string | null) {
    if (!user) return;
    try {
      await deleteReminder(user.id, id);
      if (nid) await cancelScheduledNotification(nid);
      void load();
    } catch {
      Alert.alert("Erreur", "Impossible de supprimer.");
    }
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
        <View className="w-11" />
        <View style={{ borderRadius: 999, backgroundColor: '#F2F2F7', paddingHorizontal: 40, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>Ochitsu</Text>
        </View>
        <View className="w-11" />
      </View>

      {/* Feedback Toast */}
      {showFeedback && (
        <View style={{ position: 'absolute', top: isWeb ? 80 : 100 + insets.top, alignSelf: 'center', width: 300, zIndex: 100, backgroundColor: '#fff', borderRadius: 35, padding: 24, borderWidth: 1, borderColor: '#f0f0f0', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 10 }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>{feedbackEmoji}</Text>
          <Text style={{ fontWeight: '900', textAlign: 'center', color: '#000', fontSize: 14 }}>{feedbackMsg}</Text>
        </View>
      )}

      {/* Schedule Modal */}
      <Modal visible={showScheduleModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 380, borderRadius: 40, backgroundColor: '#F2F2F7', padding: 32 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 24 }}>
              {selectedRitual?.emoji} {selectedRitual?.title}
            </Text>

            <Text style={{ fontSize: 10, fontWeight: '900', color: '#aaa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Jour</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {['Auj.', 'Dem.', '+2j', '+3j'].map((lbl, idx) => (
                <TouchableOpacity key={lbl} onPress={() => setDayOffset(idx)} style={{ flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: dayOffset === idx ? '#000' : '#fff', borderWidth: dayOffset === idx ? 0 : 1, borderColor: '#eee', alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: dayOffset === idx ? '#fff' : '#000' }}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 10, fontWeight: '900', color: '#aaa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Heure</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 24 }}>
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setHour(h => (h + 1) % 24)}><Text style={{ fontWeight: '900', fontSize: 18 }}>▲</Text></TouchableOpacity>
                <Text style={{ fontSize: 38, fontWeight: '900', color: '#000' }}>{hour.toString().padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => setHour(h => (h - 1 + 24) % 24)}><Text style={{ fontWeight: '900', fontSize: 18 }}>▼</Text></TouchableOpacity>
              </View>
              <Text style={{ fontSize: 38, fontWeight: '900', color: '#000' }}>:</Text>
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setMinute(m => (m + 1) % 60)}><Text style={{ fontWeight: '900', fontSize: 18 }}>▲</Text></TouchableOpacity>
                <Text style={{ fontSize: 38, fontWeight: '900', color: '#000' }}>{minute.toString().padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => setMinute(m => (m - 1 + 60) % 60)}><Text style={{ fontWeight: '900', fontSize: 18 }}>▼</Text></TouchableOpacity>
              </View>
            </View>

            <Text style={{ fontSize: 10, fontWeight: '900', color: '#aaa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Duree</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {DURATIONS.map(d => (
                <TouchableOpacity key={d} onPress={() => setDuration(d)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: duration === d ? '#000' : '#fff', borderWidth: duration === d ? 0 : 1, borderColor: '#eee' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: duration === d ? '#fff' : '#000' }}>{d} min</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={scheduleRitual} style={{ backgroundColor: '#000', borderRadius: 50, paddingVertical: 18, marginBottom: 14 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Valider</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
              <Text style={{ textAlign: 'center', color: '#aaa', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <WebContainer maxWidth={800} className="px-6">
          <View style={{ gap: 20 }}>

            {/* Mood Chart Card */}
            <View style={{ borderRadius: 40, backgroundColor: '#F2F2F7', padding: 28, borderWidth: 1, borderColor: '#f0f0f0' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <View>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>Mon humeur</Text>
                  <Text style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>7 derniers jours</Text>
                </View>
                {latestMood && (
                  <View style={{ backgroundColor: MOOD_CONFIG[latestMood.mood_score - 1].color, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 24 }}>{MOOD_CONFIG[latestMood.mood_score - 1].emoji}</Text>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#000', opacity: 0.5, textTransform: 'uppercase' }}>Auj.</Text>
                  </View>
                )}
              </View>

              {weekAvg > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 30, padding: 12, gap: 12 }}>
                  <View style={{ flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ width: `${(weekAvg / 5) * 100}%`, height: '100%', borderRadius: 4, backgroundColor: weekAvg >= 4 ? '#22C55E' : weekAvg >= 3 ? '#EAB308' : '#EF4444' }} />
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#000', opacity: 0.4, textTransform: 'uppercase', minWidth: 80, textAlign: 'right' }}>
                    Moy. {weekAvg.toFixed(1)}/5
                  </Text>
                </View>
              )}

              <MoodChart data={moodData} />

              <View style={{ marginTop: 24, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 30, padding: 14 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#aaa', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Comment tu te sens ?</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {MOOD_CONFIG.map((cfg, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => addMood(i + 1)}
                      activeOpacity={0.7}
                      style={{ flex: 1, alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 10, borderWidth: latestMood?.mood_score === i + 1 ? 2.5 : 0, borderColor: cfg.fill }}
                    >
                      <Text style={{ fontSize: 26 }}>{cfg.emoji}</Text>
                      <Text style={{ fontSize: 7, fontWeight: '900', color: '#000', opacity: 0.3, marginTop: 4, textTransform: 'uppercase' }}>{cfg.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Rituals */}
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', textTransform: 'uppercase', paddingHorizontal: 4 }}>Mes Rituels</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}>
              {RITUALS.map(r => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => { setSelectedRitual(r); setDayOffset(0); setShowScheduleModal(true); }}
                  activeOpacity={0.9}
                  style={{ width: 155, borderRadius: 40, backgroundColor: '#F2F2F7', padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#f0f0f0' }}
                >
                  <View style={{ height: 64, width: 64, backgroundColor: '#fff', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3 }}>
                    <Text style={{ fontSize: 30 }}>{r.emoji}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#000', textAlign: 'center', marginBottom: 10 }}>{r.title}</Text>
                  <View style={{ backgroundColor: '#000', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>Planifier</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Reminders */}
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', textTransform: 'uppercase', paddingHorizontal: 4 }}>Mon Programme</Text>

            {sortedReminders.length === 0 ? (
              <View style={{ borderRadius: 40, borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)', borderStyle: 'dashed', padding: 48, alignItems: 'center' }}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>🗓️</Text>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', fontSize: 12 }}>Rien de prevu</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {sortedReminders.map(rem => {
                  const isCall = rem.title.toLowerCase().includes('appel');
                  const date = new Date(rem.scheduled_at);
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <View key={rem.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 35, padding: 18, borderWidth: 1, borderColor: '#f0f0f0' }}>
                      <View style={{ height: 50, width: 50, borderRadius: 18, backgroundColor: isCall ? '#FEE2E2' : '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Text style={{ fontSize: 22 }}>{isCall ? '📞' : '✨'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: '#000', textTransform: 'uppercase' }}>{rem.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 8 }}>
                          <View style={{ backgroundColor: isToday ? '#000' : '#f0f0f0', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3 }}>
                            <Text style={{ fontSize: 9, fontWeight: '900', color: isToday ? '#fff' : '#aaa', textTransform: 'uppercase' }}>
                              {isToday ? "Aujourd'hui" : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: '#22C55E' }}>
                            {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => removeReminder(rem.id, rem.notification_id)} style={{ height: 38, width: 38, backgroundColor: '#fff', borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#ccc', fontWeight: '900', fontSize: 18 }}>x</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

          </View>
        </WebContainer>
      </ScrollView>
    </View>
  );
}
