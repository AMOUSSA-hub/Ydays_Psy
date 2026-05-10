/** Tables alignées sur supabase/migrations/001_initial.sql */

export type MoodScore = 1 | 2 | 3 | 4 | 5;

export interface ProfileRow {
  id: string;
  display_name: string | null;
  theme_preference: 'light' | 'dark' | 'system' | null;
  consent_privacy_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  mood_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface MoodLogRow {
  id: string;
  user_id: string;
  logged_date: string;
  mood_score: number;
  note: string | null;
  created_at: string;
}

export interface QuestionnaireRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  schema: QuestionnaireSchema;
  created_at: string;
}

export interface QuestionnaireSchema {
  questions: QuestionnaireQuestion[];
}

export interface QuestionnaireQuestion {
  id: string;
  text: string;
  options: { id: string; label: string; score: number }[];
}

export interface QuestionnaireSubmissionRow {
  id: string;
  user_id: string;
  questionnaire_id: string;
  answers: Record<string, string>;
  score: number | null;
  summary: string | null;
  created_at: string;
}

export interface ActivityRow {
  id: string;
  slug: string;
  title: string;
  type: 'breathing' | 'meditation' | 'tips';
  duration_seconds: number | null;
  body: string | null;
  audio_url: string | null;
  created_at: string;
}

export interface ActivitySessionRow {
  id: string;
  user_id: string;
  activity_id: string;
  completed_at: string;
}

export interface ReminderRow {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  scheduled_at: string;
  recurrence: string | null;
  enabled: boolean;
  notification_id: string | null;
  created_at: string;
}

export interface HelpContactRow {
  id: string;
  region: string | null;
  category: string;
  title: string;
  phone: string | null;
  url: string | null;
  sort_order: number;
  created_at: string;
}

/** Snapshot stocké en local si pas de Supabase */
export interface LocalUserStore {
  journal: JournalEntryRow[];
  mood_logs: MoodLogRow[];
  questionnaire_submissions: QuestionnaireSubmissionRow[];
  activity_sessions: ActivitySessionRow[];
  reminders: ReminderRow[];
}
