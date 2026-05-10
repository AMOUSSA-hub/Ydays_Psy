/**
 * Persistance locale quand Supabase n’est pas configuré (ou USE_LOCAL_ONLY).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  JournalEntryRow,
  MoodLogRow,
  QuestionnaireSubmissionRow,
  ActivitySessionRow,
  ReminderRow,
  HelpContactRow,
} from '@/types/database';
import { randomUuid } from '@/lib/uuid';

const PREFIX = 'ydays_local_v1_';

function key(userId: string) {
  return `${PREFIX}${userId}`;
}

export interface LocalStoreSnapshot {
  journal: JournalEntryRow[];
  mood_logs: MoodLogRow[];
  questionnaire_submissions: QuestionnaireSubmissionRow[];
  activity_sessions: ActivitySessionRow[];
  reminders: ReminderRow[];
}

const emptySnapshot = (): LocalStoreSnapshot => ({
  journal: [],
  mood_logs: [],
  questionnaire_submissions: [],
  activity_sessions: [],
  reminders: [],
});

async function loadSnapshot(userId: string): Promise<LocalStoreSnapshot> {
  const raw = await AsyncStorage.getItem(key(userId));
  if (!raw) return emptySnapshot();
  try {
    const parsed = JSON.parse(raw) as LocalStoreSnapshot;
    return {
      ...emptySnapshot(),
      ...parsed,
      journal: parsed.journal ?? [],
      mood_logs: parsed.mood_logs ?? [],
      questionnaire_submissions: parsed.questionnaire_submissions ?? [],
      activity_sessions: parsed.activity_sessions ?? [],
      reminders: parsed.reminders ?? [],
    };
  } catch {
    return emptySnapshot();
  }
}

async function saveSnapshot(userId: string, data: LocalStoreSnapshot) {
  await AsyncStorage.setItem(key(userId), JSON.stringify(data));
}

export async function getLocalStore(userId: string) {
  const snapshot = await loadSnapshot(userId);

  return {
    snapshot,

    async upsertJournal(entry: Omit<JournalEntryRow, 'created_at' | 'updated_at'> & Partial<Pick<JournalEntryRow, 'created_at' | 'updated_at'>>) {
      const now = new Date().toISOString();
      const row: JournalEntryRow = {
        ...entry,
        created_at: entry.created_at ?? now,
        updated_at: entry.updated_at ?? now,
      };
      const idx = snapshot.journal.findIndex((j) => j.id === entry.id);
      if (idx >= 0) snapshot.journal[idx] = row;
      else snapshot.journal.unshift(row);
      await saveSnapshot(userId, snapshot);
      return row;
    },

    async deleteJournal(id: string) {
      snapshot.journal = snapshot.journal.filter((j) => j.id !== id);
      await saveSnapshot(userId, snapshot);
    },

    async upsertMood(log: Omit<MoodLogRow, 'created_at'> & Partial<Pick<MoodLogRow, 'created_at'>>) {
      const row: MoodLogRow = {
        ...log,
        created_at: log.created_at ?? new Date().toISOString(),
      };
      const idx = snapshot.mood_logs.findIndex(
        (m) => m.user_id === log.user_id && m.logged_date === log.logged_date
      );
      if (idx >= 0) snapshot.mood_logs[idx] = row;
      else snapshot.mood_logs.unshift(row);
      await saveSnapshot(userId, snapshot);
      return row;
    },

    async addQuestionnaireSubmission(
      row: Omit<QuestionnaireSubmissionRow, 'id' | 'created_at'> & { id?: string }
    ) {
      const full: QuestionnaireSubmissionRow = {
        ...row,
        id: row.id ?? randomUuid(),
        created_at: new Date().toISOString(),
      };
      snapshot.questionnaire_submissions.unshift(full);
      await saveSnapshot(userId, snapshot);
      return full;
    },

    async addActivitySession(row: Omit<ActivitySessionRow, 'id'> & { id?: string }) {
      const full: ActivitySessionRow = {
        ...row,
        id: randomUuid(),
        completed_at: row.completed_at,
      };
      snapshot.activity_sessions.unshift(full);
      await saveSnapshot(userId, snapshot);
      return full;
    },

    async upsertReminder(r: ReminderRow) {
      const idx = snapshot.reminders.findIndex((x) => x.id === r.id);
      if (idx >= 0) snapshot.reminders[idx] = r;
      else snapshot.reminders.push(r);
      await saveSnapshot(userId, snapshot);
      return r;
    },

    async deleteReminder(id: string) {
      snapshot.reminders = snapshot.reminders.filter((r) => r.id !== id);
      await saveSnapshot(userId, snapshot);
    },
  };
}

/** Contacts d’aide seedés en local (TCA / suicide / général). */
export function getDefaultHelpContacts(): HelpContactRow[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'local-3114',
      region: 'FR',
      category: 'suicide',
      title: '3114 — Numéro national de prévention du suicide',
      phone: '3114',
      url: 'https://www.3114.fr',
      sort_order: 0,
      created_at: now,
    },
    {
      id: 'local-fils-sante',
      region: 'FR',
      category: 'general',
      title: 'Fil Santé Jeunes',
      phone: '0800 235 236',
      url: 'https://www.filsantejeunes.com',
      sort_order: 1,
      created_at: now,
    },
    {
      id: 'local-tca',
      region: 'FR',
      category: 'tca',
      title: 'Ligne Anorexie et Boulimie — Fédération ANAD',
      phone: '09 72 30 13 50',
      url: 'https://www.federe.fr',
      sort_order: 2,
      created_at: now,
    },
  ];
}
