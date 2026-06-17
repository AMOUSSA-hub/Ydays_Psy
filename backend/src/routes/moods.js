import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/async-handler.js';

export const moodsRouter = Router();
moodsRouter.use(requireAuth);

// GET /moods
moodsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select * from mood_logs where user_id = $1 order by logged_date desc',
      [req.user.id]
    );
    res.json(rows);
  })
);

// POST /moods  (upsert sur (user_id, logged_date))
moodsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { logged_date, mood_score, note } = req.body ?? {};
    if (!logged_date) throw new HttpError(400, 'Date requise.');
    if (!(mood_score >= 1 && mood_score <= 5)) throw new HttpError(400, 'Humeur invalide (1 à 5).');

    const { rows } = await query(
      `insert into mood_logs (user_id, logged_date, mood_score, note)
       values ($1, $2, $3, $4)
       on conflict (user_id, logged_date)
       do update set mood_score = excluded.mood_score, note = excluded.note
       returning *`,
      [req.user.id, logged_date, mood_score, note ?? null]
    );
    res.status(201).json(rows[0]);
  })
);
