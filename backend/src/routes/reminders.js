import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/async-handler.js';

export const remindersRouter = Router();
remindersRouter.use(requireAuth);

// GET /reminders
remindersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select * from reminders where user_id = $1 order by scheduled_at',
      [req.user.id]
    );
    res.json(rows);
  })
);

// POST /reminders  (création ou mise à jour si id fourni)
remindersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { id, title, body, scheduled_at, recurrence, enabled, notification_id } = req.body ?? {};
    if (!title || !scheduled_at) throw new HttpError(400, 'Titre et date requis.');

    if (id) {
      const { rows } = await query(
        `update reminders
         set title = $1, body = $2, scheduled_at = $3, recurrence = $4, enabled = $5, notification_id = $6
         where id = $7 and user_id = $8
         returning *`,
        [title, body ?? null, scheduled_at, recurrence ?? null, enabled ?? true, notification_id ?? null, id, req.user.id]
      );
      if (!rows[0]) throw new HttpError(404, 'Rappel introuvable.');
      return res.json(rows[0]);
    }

    const { rows } = await query(
      `insert into reminders (user_id, title, body, scheduled_at, recurrence, enabled, notification_id)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [req.user.id, title, body ?? null, scheduled_at, recurrence ?? null, enabled ?? true, notification_id ?? null]
    );
    res.status(201).json(rows[0]);
  })
);

// DELETE /reminders/:id
remindersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await query('delete from reminders where id = $1 and user_id = $2', [req.params.id, req.user.id]);
    res.status(204).end();
  })
);
