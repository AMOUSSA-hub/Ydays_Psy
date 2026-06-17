import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/async-handler.js';

export const activitiesRouter = Router();
activitiesRouter.use(requireAuth);

// GET /activities  (référentiel)
activitiesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await query('select * from activities order by title');
    res.json(rows);
  })
);

// GET /activities/sessions/count  (nombre de séances réalisées)
activitiesRouter.get(
  '/sessions/count',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select count(*)::int as count from activity_sessions where user_id = $1',
      [req.user.id]
    );
    res.json({ count: rows[0].count });
  })
);

// POST /activities/sessions  (enregistrer une séance réalisée)
activitiesRouter.post(
  '/sessions',
  asyncHandler(async (req, res) => {
    const { activity_id } = req.body ?? {};
    if (!activity_id) throw new HttpError(400, 'Activité requise.');
    const { rows } = await query(
      'insert into activity_sessions (user_id, activity_id) values ($1, $2) returning *',
      [req.user.id, activity_id]
    );
    res.status(201).json(rows[0]);
  })
);
