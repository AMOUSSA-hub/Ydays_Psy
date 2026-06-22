/**
 * Couche de données « espace professionnel » — Supabase.
 *
 * Les politiques RLS garantissent que le professionnel ne reçoit que les lignes
 * partagées (`is_shared`) des patients qui l'ont relié. Les agrégats (moyenne,
 * tendance) sont calculés côté client.
 */
import { supabase } from '@/lib/supabase';
import type {
  JournalEntryRow,
  MoodLogRow,
  QuestionnaireSubmissionRow,
} from '@/types/database';

function db() {
  if (!supabase) throw new Error('Supabase non configuré.');
  return supabase;
}

async function currentUserId(): Promise<string> {
  const { data } = await db().auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error('Non authentifié.');
  return id;
}

export const MOOD_CONFIG = [
  { emoji: '😢', label: 'Difficile', color: '#FECACA', fill: '#EF4444' },
  { emoji: '🙁', label: 'Pas top', color: '#FED7AA', fill: '#F97316' },
  { emoji: '😐', label: 'Neutre', color: '#FEF08A', fill: '#EAB308' },
  { emoji: '🙂', label: 'Bien', color: '#BBF7D0', fill: '#22C55E' },
  { emoji: '😊', label: 'Super', color: '#BAE6FD', fill: '#06B6D4' },
];

export type MoodTrend = 'up' | 'down' | 'flat';

export interface PatientSummary {
  id: string;
  name: string;
  email: string | null;
  isDemo: boolean;
  lastMoodScore: number | null;
  lastMoodDate: string | null;
  weekAvg: number | null;
  trend: MoodTrend | null;
  sharedJournalCount: number;
  moodLogsCount: number;
  submissionsCount: number;
  needsAttention: boolean;
}

export interface PatientDetail {
  id: string;
  name: string;
  email: string | null;
  isDemo: boolean;
  followedSince: string | null;
  moodLogs: MoodLogRow[];
  sharedJournal: JournalEntryRow[];
  submissions: QuestionnaireSubmissionRow[];
}

export interface UpcomingAppointment {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  date: string;
}

const TREND_DELTA = 0.3;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function nameOf(displayName: string | null | undefined, email: string | null | undefined): string {
  if (displayName) return displayName;
  if (email) {
    const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
    return local
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return 'Patient';
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function weekAvgOf(moods: { logged_date: string; mood_score: number }[]): number | null {
  const cutoff = isoDaysAgo(6);
  const recent = moods.filter((m) => m.logged_date >= cutoff);
  if (!recent.length) return null;
  return recent.reduce((s, m) => s + m.mood_score, 0) / recent.length;
}

function trendOf(moodsDesc: { mood_score: number }[]): MoodTrend | null {
  if (moodsDesc.length < 2) return null;
  const recent = moodsDesc.slice(0, 3);
  const older = moodsDesc.slice(3, 6);
  if (!older.length) return null;
  const avg = (a: { mood_score: number }[]) => a.reduce((s, m) => s + m.mood_score, 0) / a.length;
  const diff = avg(recent) - avg(older);
  if (diff > TREND_DELTA) return 'up';
  if (diff < -TREND_DELTA) return 'down';
  return 'flat';
}

async function linkedPatientIds(proId: string): Promise<string[]> {
  const { data, error } = await db()
    .from('patient_professional_links')
    .select('patient_id')
    .eq('professional_id', proId);
  if (error) throw error;
  return (data ?? []).map((l: any) => l.patient_id as string);
}

// ─── API publique ───────────────────────────────────────────────────────────────
export async function listPatientSummaries(): Promise<PatientSummary[]> {
  const me = await currentUserId();
  const ids = await linkedPatientIds(me);
  if (!ids.length) return [];

  const [profilesRes, moodsRes, journalRes, subsRes] = await Promise.all([
    db().from('profiles').select('id, display_name, email').in('id', ids),
    db().from('mood_logs').select('user_id, logged_date, mood_score').in('user_id', ids).order('logged_date', { ascending: false }),
    db().from('journal_entries').select('user_id').in('user_id', ids), // RLS → uniquement partagées
    db().from('questionnaire_submissions').select('user_id').in('user_id', ids), // RLS → uniquement partagées
  ]);
  for (const r of [profilesRes, moodsRes, journalRes, subsRes]) {
    if (r.error) throw r.error;
  }

  const moodsByUser = new Map<string, { logged_date: string; mood_score: number }[]>();
  for (const m of (moodsRes.data ?? []) as any[]) {
    const arr = moodsByUser.get(m.user_id) ?? [];
    arr.push({ logged_date: m.logged_date, mood_score: m.mood_score });
    moodsByUser.set(m.user_id, arr);
  }
  const countBy = (rows: any[]) => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.user_id, (map.get(r.user_id) ?? 0) + 1);
    return map;
  };
  const journalCount = countBy((journalRes.data ?? []) as any[]);
  const subsCount = countBy((subsRes.data ?? []) as any[]);

  const summaries = ((profilesRes.data ?? []) as any[]).map((p) => {
    const moods = moodsByUser.get(p.id) ?? [];
    const last = moods[0] ?? null; // triés desc
    const weekAvg = weekAvgOf(moods);
    const trend = trendOf(moods);
    const needsAttention =
      (last?.mood_score ?? 5) <= 2 || (weekAvg !== null && weekAvg <= 2.2) || trend === 'down';
    return {
      id: p.id,
      name: nameOf(p.display_name, p.email),
      email: p.email ?? null,
      isDemo: false,
      lastMoodScore: last?.mood_score ?? null,
      lastMoodDate: last?.logged_date ?? null,
      weekAvg,
      trend,
      sharedJournalCount: journalCount.get(p.id) ?? 0,
      moodLogsCount: moods.length,
      submissionsCount: subsCount.get(p.id) ?? 0,
      needsAttention,
    };
  });

  summaries.sort((a, b) => {
    if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return summaries;
}

export async function getPatientDetail(id: string): Promise<PatientDetail | null> {
  try {
    const [profileRes, moodsRes, journalRes, subsRes] = await Promise.all([
      db().from('profiles').select('id, display_name, email').eq('id', id).maybeSingle(),
      db().from('mood_logs').select('*').eq('user_id', id).order('logged_date', { ascending: false }),
      db().from('journal_entries').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      db().from('questionnaire_submissions').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    ]);

    const moodLogs = (moodsRes.data ?? []) as MoodLogRow[];
    const sharedJournal = (journalRes.data ?? []) as JournalEntryRow[];
    const submissions = (subsRes.data ?? []) as QuestionnaireSubmissionRow[];
    const profile = profileRes.data as { display_name: string | null; email: string | null } | null;

    const dates = [
      ...moodLogs.map((m) => m.created_at),
      ...sharedJournal.map((j) => j.created_at),
    ].filter(Boolean);
    const followedSince = dates.length
      ? dates.reduce((min, d) => (new Date(d) < new Date(min) ? d : min), dates[0])
      : null;

    return {
      id,
      name: nameOf(profile?.display_name, profile?.email),
      email: profile?.email ?? null,
      isDemo: false,
      followedSince,
      moodLogs,
      sharedJournal,
      submissions,
    };
  } catch {
    return null;
  }
}

export async function listUpcomingAppointments(): Promise<UpcomingAppointment[]> {
  const me = await currentUserId();
  const ids = await linkedPatientIds(me);
  if (!ids.length) return [];

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [remRes, profRes] = await Promise.all([
    db().from('reminders').select('id, user_id, title, scheduled_at').in('user_id', ids).gte('scheduled_at', since).order('scheduled_at'),
    db().from('profiles').select('id, display_name, email').in('id', ids),
  ]);
  if (remRes.error) throw remRes.error;

  const names = new Map<string, { display_name: string | null; email: string | null }>();
  for (const p of (profRes.data ?? []) as any[]) names.set(p.id, { display_name: p.display_name, email: p.email });

  return ((remRes.data ?? []) as any[]).map((r) => {
    const p = names.get(r.user_id);
    return {
      id: r.id,
      patientId: r.user_id,
      patientName: nameOf(p?.display_name, p?.email),
      title: r.title,
      date: r.scheduled_at,
    };
  });
}
