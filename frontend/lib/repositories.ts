/**
 * Couche d'accès aux données : appelle l'API backend (Node/Express + PostgreSQL).
 * Les paramètres `userId` sont conservés pour compatibilité des écrans mais
 * l'utilisateur effectif est déterminé côté serveur via le jeton JWT.
 */
import { api } from '@/lib/api';
import type {
  ActivityRow,
  HelpContactRow,
  JournalEntryRow,
  MoodLogRow,
  QuestionnaireRow,
  QuestionnaireSubmissionRow,
  ReminderRow,
} from '@/types/database';

// ─── Journal ────────────────────────────────────────────────────────────────
export async function getJournalEntry(_userId: string, id: string): Promise<JournalEntryRow | null> {
  try {
    return await api<JournalEntryRow>(`/journal/${id}`);
  } catch {
    return null;
  }
}

export async function listJournalEntries(_userId: string): Promise<JournalEntryRow[]> {
  return api<JournalEntryRow[]>('/journal');
}

export async function saveJournalEntry(
  _userId: string,
  partial: Partial<JournalEntryRow> & { title: string; body: string }
): Promise<JournalEntryRow> {
  return api<JournalEntryRow>('/journal', {
    method: 'POST',
    body: {
      id: partial.id,
      title: partial.title,
      body: partial.body,
      mood_score: partial.mood_score ?? null,
      is_shared: partial.is_shared ?? false,
    },
  });
}

export async function deleteJournalEntry(_userId: string, id: string): Promise<void> {
  await api(`/journal/${id}`, { method: 'DELETE' });
}

// ─── Humeur ───────────────────────────────────────────────────────────────────
export async function listMoodLogs(_userId: string): Promise<MoodLogRow[]> {
  return api<MoodLogRow[]>('/moods');
}

export async function upsertMoodLog(
  _userId: string,
  loggedDate: string,
  moodScore: number,
  note?: string | null
): Promise<MoodLogRow> {
  return api<MoodLogRow>('/moods', {
    method: 'POST',
    body: { logged_date: loggedDate, mood_score: moodScore, note: note ?? null },
  });
}

// ─── Questionnaires / bilans ───────────────────────────────────────────────────
export async function listQuestionnaires(): Promise<QuestionnaireRow[]> {
  return api<QuestionnaireRow[]>('/questionnaires');
}

export async function submitQuestionnaire(
  _userId: string,
  questionnaireId: string,
  answers: Record<string, string>,
  score: number,
  summary: string
): Promise<QuestionnaireSubmissionRow> {
  return api<QuestionnaireSubmissionRow>('/questionnaires/submissions', {
    method: 'POST',
    body: { questionnaire_id: questionnaireId, answers, score, summary },
  });
}

export async function listQuestionnaireSubmissions(
  _userId: string
): Promise<QuestionnaireSubmissionRow[]> {
  return api<QuestionnaireSubmissionRow[]>('/questionnaires/submissions');
}

// ─── Activités ─────────────────────────────────────────────────────────────────
export async function listActivities(): Promise<ActivityRow[]> {
  return api<ActivityRow[]>('/activities');
}

export async function countActivitySessions(_userId: string): Promise<number> {
  const { count } = await api<{ count: number }>('/activities/sessions/count');
  return count;
}

export async function recordActivitySession(_userId: string, activityId: string): Promise<void> {
  await api('/activities/sessions', { method: 'POST', body: { activity_id: activityId } });
}

// ─── Rappels ───────────────────────────────────────────────────────────────────
export async function listReminders(_userId: string): Promise<ReminderRow[]> {
  return api<ReminderRow[]>('/reminders');
}

export async function saveReminder(
  _userId: string,
  partial: Partial<ReminderRow> & Pick<ReminderRow, 'title' | 'scheduled_at'>
): Promise<ReminderRow> {
  return api<ReminderRow>('/reminders', {
    method: 'POST',
    body: {
      id: partial.id,
      title: partial.title,
      body: partial.body ?? null,
      scheduled_at: partial.scheduled_at,
      recurrence: partial.recurrence ?? null,
      enabled: partial.enabled ?? true,
      notification_id: partial.notification_id ?? null,
    },
  });
}

export async function deleteReminder(_userId: string, id: string): Promise<void> {
  await api(`/reminders/${id}`, { method: 'DELETE' });
}

// ─── Contacts d'aide ───────────────────────────────────────────────────────────
export async function listHelpContacts(): Promise<HelpContactRow[]> {
  return api<HelpContactRow[]>('/help-contacts');
}

// ─── Liaison patient ↔ professionnel ───────────────────────────────────────────
export interface LinkedProfessional {
  id: string;
  display_name: string | null;
  email: string;
}

export async function getMyProfessional(): Promise<LinkedProfessional | null> {
  const { professional } = await api<{ professional: LinkedProfessional | null }>(
    '/links/professional'
  );
  return professional;
}

export async function linkProfessional(code: string): Promise<LinkedProfessional> {
  const { professional } = await api<{ professional: LinkedProfessional }>('/links', {
    method: 'POST',
    body: { code },
  });
  return professional;
}

export async function unlinkProfessional(professionalId: string): Promise<void> {
  await api(`/links/${professionalId}`, { method: 'DELETE' });
}

/** Code d'invitation du professionnel connecté (à communiquer à ses patients). */
export async function getMyInviteCode(): Promise<string | null> {
  const { invite_code } = await api<{ invite_code: string | null }>('/pro/invite-code');
  return invite_code;
}
