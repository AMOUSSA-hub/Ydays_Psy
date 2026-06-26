/**
 * Couche d'accès aux données — Supabase (PostgreSQL + RLS).
 *
 * Le contrôle d'accès (propriétaire / partage avec le pro) est appliqué par les
 * politiques RLS côté base. Les paramètres `userId` sont conservés pour
 * compatibilité des écrans ; l'utilisateur effectif vient du jeton Supabase.
 */
import { supabase } from '@/lib/supabase';
import type {
  ActivityRow,
  HelpContactRow,
  JournalEntryRow,
  MoodLogRow,
  QuestionnaireRow,
  QuestionnaireSubmissionRow,
  ReminderRow,
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

// ─── Journal ──────────────────────────────────────────────────────────────────
export async function getJournalEntry(userId: string, id: string): Promise<JournalEntryRow | null> {
  const { data, error } = await db()
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as JournalEntryRow) ?? null;
}

export async function listJournalEntries(userId: string): Promise<JournalEntryRow[]> {
  const { data, error } = await db()
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as JournalEntryRow[]) ?? [];
}

export async function saveJournalEntry(
  userId: string,
  partial: Partial<JournalEntryRow> & { title: string; body: string }
): Promise<JournalEntryRow> {
  const payload = {
    user_id: userId,
    title: partial.title,
    body: partial.body,
    mood_score: partial.mood_score ?? null,
    image_data: partial.image_data ?? null,
    is_shared: partial.is_shared ?? false,
  };
  if (partial.id) {
    const { data, error } = await db()
      .from('journal_entries')
      .update(payload)
      .eq('id', partial.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as JournalEntryRow;
  }
  const { data, error } = await db().from('journal_entries').insert(payload).select().single();
  if (error) throw error;
  return data as JournalEntryRow;
}

export async function deleteJournalEntry(userId: string, id: string): Promise<void> {
  const { error } = await db().from('journal_entries').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// ─── Humeur ───────────────────────────────────────────────────────────────────
export async function listMoodLogs(userId: string): Promise<MoodLogRow[]> {
  const { data, error } = await db()
    .from('mood_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_date', { ascending: false });
  if (error) throw error;
  return (data as MoodLogRow[]) ?? [];
}

export async function upsertMoodLog(
  userId: string,
  loggedDate: string,
  moodScore: number,
  note?: string | null
): Promise<MoodLogRow> {
  const { data, error } = await db()
    .from('mood_logs')
    .upsert(
      { user_id: userId, logged_date: loggedDate, mood_score: moodScore, note: note ?? null },
      { onConflict: 'user_id,logged_date' }
    )
    .select()
    .single();
  if (error) throw error;
  return data as MoodLogRow;
}

// ─── Questionnaires / bilans ───────────────────────────────────────────────────
export async function listQuestionnaires(): Promise<QuestionnaireRow[]> {
  const { data, error } = await db().from('questionnaires').select('*').order('created_at');
  if (error) throw error;
  return (data as QuestionnaireRow[]) ?? [];
}

export async function submitQuestionnaire(
  userId: string,
  questionnaireId: string,
  answers: Record<string, string>,
  score: number,
  summary: string
): Promise<QuestionnaireSubmissionRow> {
  const { data, error } = await db()
    .from('questionnaire_submissions')
    .insert({ user_id: userId, questionnaire_id: questionnaireId, answers, score, summary })
    .select()
    .single();
  if (error) throw error;
  return data as QuestionnaireSubmissionRow;
}

export async function listQuestionnaireSubmissions(userId: string): Promise<QuestionnaireSubmissionRow[]> {
  const { data, error } = await db()
    .from('questionnaire_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as QuestionnaireSubmissionRow[]) ?? [];
}

// ─── Activités ─────────────────────────────────────────────────────────────────
export async function listActivities(): Promise<ActivityRow[]> {
  const { data, error } = await db().from('activities').select('*').order('title');
  if (error) throw error;
  return (data as ActivityRow[]) ?? [];
}

export async function countActivitySessions(userId: string): Promise<number> {
  const { count, error } = await db()
    .from('activity_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

export async function recordActivitySession(userId: string, activityId: string): Promise<void> {
  const { error } = await db()
    .from('activity_sessions')
    .insert({ user_id: userId, activity_id: activityId });
  if (error) throw error;
}

// ─── Rappels ───────────────────────────────────────────────────────────────────
export async function listReminders(userId: string): Promise<ReminderRow[]> {
  const { data, error } = await db()
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_at');
  if (error) throw error;
  return (data as ReminderRow[]) ?? [];
}

export async function saveReminder(
  userId: string,
  partial: Partial<ReminderRow> & Pick<ReminderRow, 'title' | 'scheduled_at'>
): Promise<ReminderRow> {
  const payload = {
    user_id: userId,
    title: partial.title,
    body: partial.body ?? null,
    scheduled_at: partial.scheduled_at,
    recurrence: partial.recurrence ?? null,
    enabled: partial.enabled ?? true,
    notification_id: partial.notification_id ?? null,
  };
  if (partial.id) {
    const { data, error } = await db()
      .from('reminders')
      .update(payload)
      .eq('id', partial.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as ReminderRow;
  }
  const { data, error } = await db().from('reminders').insert(payload).select().single();
  if (error) throw error;
  return data as ReminderRow;
}

export async function deleteReminder(userId: string, id: string): Promise<void> {
  const { error } = await db().from('reminders').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// ─── Contacts d'aide ───────────────────────────────────────────────────────────
export async function listHelpContacts(): Promise<HelpContactRow[]> {
  const { data, error } = await db().from('help_contacts').select('*').order('sort_order');
  if (error) throw error;
  return (data as HelpContactRow[]) ?? [];
}

// ─── Liaison patient ↔ professionnel ───────────────────────────────────────────
export interface LinkedProfessional {
  id: string;
  display_name: string | null;
  email: string;
}

export async function getMyProfessional(): Promise<LinkedProfessional | null> {
  const me = await currentUserId();
  const { data: link, error } = await db()
    .from('patient_professional_links')
    .select('professional_id')
    .eq('patient_id', me)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!link) return null;
  const { data: prof } = await db()
    .from('profiles')
    .select('id, display_name, email')
    .eq('id', link.professional_id)
    .maybeSingle();
  return prof
    ? { id: prof.id, display_name: prof.display_name ?? null, email: prof.email ?? '' }
    : { id: link.professional_id, display_name: null, email: '' };
}

export async function linkProfessional(code: string): Promise<LinkedProfessional> {
  const me = await currentUserId();
  const { data: prof, error } = await db()
    .from('profiles')
    .select('id, display_name, email')
    .eq('invite_code', code.trim().toUpperCase())
    .eq('role', 'professional')
    .maybeSingle();
  if (error) throw error;
  if (!prof) throw new Error("Code d'invitation invalide.");

  const { error: insErr } = await db()
    .from('patient_professional_links')
    .upsert(
      { patient_id: me, professional_id: prof.id },
      { onConflict: 'patient_id,professional_id' }
    );
  if (insErr) throw insErr;
  return { id: prof.id, display_name: prof.display_name ?? null, email: prof.email ?? '' };
}

export async function unlinkProfessional(professionalId: string): Promise<void> {
  const me = await currentUserId();
  const { error } = await db()
    .from('patient_professional_links')
    .delete()
    .eq('patient_id', me)
    .eq('professional_id', professionalId);
  if (error) throw error;
}

/** Code d'invitation du professionnel connecté. */
export async function getMyInviteCode(): Promise<string | null> {
  const me = await currentUserId();
  const { data, error } = await db()
    .from('profiles')
    .select('invite_code')
    .eq('id', me)
    .maybeSingle();
  if (error) throw error;
  return data?.invite_code ?? null;
}
