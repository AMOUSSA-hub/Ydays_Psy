import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/async-handler.js';

export const proRouter = Router();
proRouter.use(requireAuth, requireRole('professional'));

const TREND_DELTA = 0.3;

function nameOf(displayName, email) {
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

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function computeWeekAvg(logs) {
  const cutoff = isoDaysAgo(6);
  const recent = logs.filter((l) => l.logged_date >= cutoff);
  if (!recent.length) return null;
  return recent.reduce((s, l) => s + l.mood_score, 0) / recent.length;
}

// logs triés du plus récent au plus ancien
function computeTrend(logsDesc) {
  if (logsDesc.length < 2) return null;
  const recent = logsDesc.slice(0, 3);
  const older = logsDesc.slice(3, 6);
  if (!older.length) return null;
  const avg = (a) => a.reduce((s, l) => s + l.mood_score, 0) / a.length;
  const diff = avg(recent) - avg(older);
  if (diff > TREND_DELTA) return 'up';
  if (diff < -TREND_DELTA) return 'down';
  return 'flat';
}

/** Vérifie qu'un lien existe entre le professionnel courant et un patient. */
async function ensureLinked(professionalId, patientId) {
  const { rowCount } = await query(
    'select 1 from patient_professional_links where professional_id = $1 and patient_id = $2',
    [professionalId, patientId]
  );
  if (rowCount === 0) throw new HttpError(403, "Ce patient ne partage pas ses données avec vous.");
}

// GET /pro/invite-code  → code à communiquer aux patients
proRouter.get(
  '/invite-code',
  asyncHandler(async (req, res) => {
    const { rows } = await query('select invite_code from users where id = $1', [req.user.id]);
    res.json({ invite_code: rows[0]?.invite_code ?? null });
  })
);

// GET /pro/patients  → résumés des patients liés (données partagées uniquement)
proRouter.get(
  '/patients',
  asyncHandler(async (req, res) => {
    const proId = req.user.id;
    const { rows: patients } = await query(
      `select u.id, u.display_name, u.email
       from patient_professional_links l
       join users u on u.id = l.patient_id
       where l.professional_id = $1`,
      [proId]
    );
    if (patients.length === 0) return res.json([]);

    const ids = patients.map((p) => p.id);

    const [moods, journalCounts, submissionCounts] = await Promise.all([
      query(
        'select user_id, logged_date, mood_score from mood_logs where user_id = any($1) order by logged_date desc',
        [ids]
      ),
      query(
        'select user_id, count(*)::int as c from journal_entries where user_id = any($1) and is_shared = true group by user_id',
        [ids]
      ),
      query(
        'select user_id, count(*)::int as c from questionnaire_submissions where user_id = any($1) and is_shared = true group by user_id',
        [ids]
      ),
    ]);

    const moodsByUser = new Map();
    for (const m of moods.rows) {
      const arr = moodsByUser.get(m.user_id) ?? [];
      arr.push(m);
      moodsByUser.set(m.user_id, arr);
    }
    const journalByUser = new Map(journalCounts.rows.map((r) => [r.user_id, r.c]));
    const submissionByUser = new Map(submissionCounts.rows.map((r) => [r.user_id, r.c]));

    const summaries = patients.map((p) => {
      const logsDesc = moodsByUser.get(p.id) ?? [];
      const last = logsDesc[0] ?? null;
      const weekAvg = computeWeekAvg(logsDesc);
      const trend = computeTrend(logsDesc);
      const needsAttention =
        (last?.mood_score ?? 5) <= 2 || (weekAvg !== null && weekAvg <= 2.2) || trend === 'down';
      return {
        id: p.id,
        name: nameOf(p.display_name, p.email),
        email: p.email,
        isDemo: false,
        lastMoodScore: last?.mood_score ?? null,
        lastMoodDate: last?.logged_date ?? null,
        weekAvg,
        trend,
        sharedJournalCount: journalByUser.get(p.id) ?? 0,
        moodLogsCount: logsDesc.length,
        submissionsCount: submissionByUser.get(p.id) ?? 0,
        needsAttention,
      };
    });

    summaries.sort((a, b) => {
      if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    res.json(summaries);
  })
);

// GET /pro/patients/:id  → détail (données partagées uniquement)
proRouter.get(
  '/patients/:id',
  asyncHandler(async (req, res) => {
    const proId = req.user.id;
    const patientId = req.params.id;
    await ensureLinked(proId, patientId);

    const { rows: userRows } = await query(
      'select id, display_name, email from users where id = $1',
      [patientId]
    );
    const patient = userRows[0];
    if (!patient) throw new HttpError(404, 'Patient introuvable.');

    const [moods, journal, submissions] = await Promise.all([
      query('select * from mood_logs where user_id = $1 order by logged_date desc', [patientId]),
      query(
        'select * from journal_entries where user_id = $1 and is_shared = true order by created_at desc',
        [patientId]
      ),
      query(
        'select * from questionnaire_submissions where user_id = $1 and is_shared = true order by created_at desc',
        [patientId]
      ),
    ]);

    const dates = [
      ...moods.rows.map((m) => m.created_at),
      ...journal.rows.map((j) => j.created_at),
    ].filter(Boolean);
    const followedSince = dates.length
      ? dates.reduce((min, d) => (new Date(d) < new Date(min) ? d : min), dates[0])
      : null;

    res.json({
      id: patient.id,
      name: nameOf(patient.display_name, patient.email),
      email: patient.email,
      isDemo: false,
      followedSince,
      moodLogs: moods.rows,
      sharedJournal: journal.rows,
      submissions: submissions.rows,
    });
  })
);

// GET /pro/appointments  → rappels à venir des patients liés
proRouter.get(
  '/appointments',
  asyncHandler(async (req, res) => {
    const proId = req.user.id;
    const { rows } = await query(
      `select r.id, r.title, r.scheduled_at as date, u.id as patient_id,
              u.display_name, u.email
       from reminders r
       join patient_professional_links l on l.patient_id = r.user_id
       join users u on u.id = r.user_id
       where l.professional_id = $1
         and r.scheduled_at >= now() - interval '1 day'
       order by r.scheduled_at asc`,
      [proId]
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        patientId: r.patient_id,
        patientName: nameOf(r.display_name, r.email),
        title: r.title,
        date: r.date,
      }))
    );
  })
);
