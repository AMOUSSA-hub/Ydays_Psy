/**
 * Couche d’accès aux données : Supabase si configuré, sinon magasin local AsyncStorage.
 */
import { HAS_SUPABASE } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { getLocalStore, getDefaultHelpContacts } from '@/lib/local-store';
import { randomUuid } from '@/lib/uuid';
import { getDefaultActivities, getDefaultQuestionnaires } from '@/data/default-content';
import type {
  ActivityRow,
  HelpContactRow,
  JournalEntryRow,
  MoodLogRow,
  QuestionnaireRow,
  QuestionnaireSubmissionRow,
  ReminderRow,
} from '@/types/database';

export async function getJournalEntry(userId: string, id: string): Promise<JournalEntryRow | null> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as JournalEntryRow | null;
  }
  const store = await getLocalStore(userId);
  return store.snapshot.journal.find((j) => j.id === id) ?? null;
}

export async function listJournalEntries(userId: string): Promise<JournalEntryRow[]> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  const store = await getLocalStore(userId);
  return [...store.snapshot.journal].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function saveJournalEntry(
  userId: string,
  partial: Partial<JournalEntryRow> & { title: string; body: string }
): Promise<JournalEntryRow> {
  const id = partial.id ?? randomUuid();
  if (HAS_SUPABASE && supabase) {
    const payload = {
      id,
      user_id: userId,
      title: partial.title,
      body: partial.body,
      mood_score: partial.mood_score ?? null,
      is_shared: partial.is_shared ?? false,
    };
    const { data, error } = await supabase
      .from('journal_entries')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as JournalEntryRow;
  }
  const store = await getLocalStore(userId);
  return store.upsertJournal({
    id,
    user_id: userId,
    title: partial.title,
    body: partial.body,
    mood_score: partial.mood_score ?? null,
    is_shared: partial.is_shared ?? false,
    created_at: partial.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function deleteJournalEntry(userId: string, id: string): Promise<void> {
  if (HAS_SUPABASE && supabase) {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return;
  }
  const store = await getLocalStore(userId);
  await store.deleteJournal(id);
}

export async function listMoodLogs(userId: string): Promise<MoodLogRow[]> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_date', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  const store = await getLocalStore(userId);
  return [...store.snapshot.mood_logs].sort(
    (a, b) => new Date(b.logged_date).getTime() - new Date(a.logged_date).getTime()
  );
}

export async function upsertMoodLog(
  userId: string,
  loggedDate: string,
  moodScore: number,
  note?: string | null
): Promise<MoodLogRow> {
  if (HAS_SUPABASE && supabase) {
    const row = {
      user_id: userId,
      logged_date: loggedDate,
      mood_score: moodScore,
      note: note ?? null,
    };
    const { data, error } = await supabase
      .from('mood_logs')
      .upsert(row, { onConflict: 'user_id,logged_date' })
      .select()
      .single();
    if (error) throw error;
    return data as MoodLogRow;
  }
  const store = await getLocalStore(userId);
  return store.upsertMood({
    id: randomUuid(),
    user_id: userId,
    logged_date: loggedDate,
    mood_score: moodScore,
    note: note ?? null,
  });
}

export async function listQuestionnaires(): Promise<QuestionnaireRow[]> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase.from('questionnaires').select('*').order('created_at');
    if (error) throw error;
    if (data?.length) return data as QuestionnaireRow[];
  }
  return getDefaultQuestionnaires();
}

export async function submitQuestionnaire(
  userId: string,
  questionnaireId: string,
  answers: Record<string, string>,
  score: number,
  summary: string
): Promise<QuestionnaireSubmissionRow> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from('questionnaire_submissions')
      .insert({
        user_id: userId,
        questionnaire_id: questionnaireId,
        answers,
        score,
        summary,
      })
      .select()
      .single();
    if (error) throw error;
    return data as QuestionnaireSubmissionRow;
  }
  const store = await getLocalStore(userId);
  return store.addQuestionnaireSubmission({
    user_id: userId,
    questionnaire_id: questionnaireId,
    answers,
    score,
    summary,
  });
}

export async function listQuestionnaireSubmissions(userId: string): Promise<QuestionnaireSubmissionRow[]> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from('questionnaire_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  const store = await getLocalStore(userId);
  return [...store.snapshot.questionnaire_submissions];
}

export async function listActivities(): Promise<ActivityRow[]> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase.from('activities').select('*').order('title');
    if (error) throw error;
    if (data?.length) return data as ActivityRow[];
  }
  return getDefaultActivities();
}

export async function countActivitySessions(userId: string): Promise<number> {
  if (HAS_SUPABASE && supabase) {
    const { count, error } = await supabase
      .from('activity_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) throw error;
    return count ?? 0;
  }
  const store = await getLocalStore(userId);
  return store.snapshot.activity_sessions.length;
}

export async function recordActivitySession(userId: string, activityId: string): Promise<void> {
  if (HAS_SUPABASE && supabase) {
    const { error } = await supabase.from('activity_sessions').insert({
      user_id: userId,
      activity_id: activityId,
    });
    if (error) throw error;
    return;
  }
  const store = await getLocalStore(userId);
  await store.addActivitySession({
    user_id: userId,
    activity_id: activityId,
    completed_at: new Date().toISOString(),
  });
}

export async function listReminders(userId: string): Promise<ReminderRow[]> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_at');
    if (error) throw error;
    return data ?? [];
  }
  const store = await getLocalStore(userId);
  return [...store.snapshot.reminders];
}

export async function saveReminder(
  userId: string,
  partial: Partial<ReminderRow> & Pick<ReminderRow, 'title' | 'scheduled_at'>
): Promise<ReminderRow> {
  const id = partial.id ?? randomUuid();
  const now = new Date().toISOString();
  const row: ReminderRow = {
    id,
    user_id: userId,
    title: partial.title,
    body: partial.body ?? null,
    scheduled_at: partial.scheduled_at,
    recurrence: partial.recurrence ?? null,
    enabled: partial.enabled ?? true,
    notification_id: partial.notification_id ?? null,
    created_at: partial.created_at ?? now,
  };
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase.from('reminders').upsert(row).select().single();
    if (error) throw error;
    return data as ReminderRow;
  }
  const store = await getLocalStore(userId);
  return store.upsertReminder(row);
}

export async function deleteReminder(userId: string, id: string): Promise<void> {
  if (HAS_SUPABASE && supabase) {
    const { error } = await supabase.from('reminders').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return;
  }
  const store = await getLocalStore(userId);
  await store.deleteReminder(id);
}

export async function listHelpContacts(): Promise<HelpContactRow[]> {
  if (HAS_SUPABASE && supabase) {
    const { data, error } = await supabase.from('help_contacts').select('*').order('sort_order');
    if (error) throw error;
    if (data?.length) return data as HelpContactRow[];
  }
  return getDefaultHelpContacts();
}
