/**
 * Couche de données « espace professionnel » — branchée sur l'API backend.
 *
 * Un professionnel ne voit que les données partagées par les patients qui l'ont
 * relié via son code d'invitation (humeur, notes `is_shared`, bilans). Toute la
 * logique d'accès et d'agrégation est appliquée côté serveur.
 */
import { api } from '@/lib/api';
import type {
  JournalEntryRow,
  MoodLogRow,
  QuestionnaireSubmissionRow,
} from '@/types/database';

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

export async function listPatientSummaries(): Promise<PatientSummary[]> {
  return api<PatientSummary[]>('/pro/patients');
}

export async function getPatientDetail(id: string): Promise<PatientDetail | null> {
  try {
    return await api<PatientDetail>(`/pro/patients/${id}`);
  } catch {
    return null;
  }
}

export async function listUpcomingAppointments(): Promise<UpcomingAppointment[]> {
  return api<UpcomingAppointment[]>('/pro/appointments');
}
