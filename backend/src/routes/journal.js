import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/async-handler.js';

export const journalRouter = Router();
journalRouter.use(requireAuth);

// GET /journal
journalRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select * from journal_entries where user_id = $1 order by created_at desc',
      [req.user.id]
    );
    res.json(rows);
  })
);

// GET /journal/:id
journalRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select * from journal_entries where id = $1 and user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) throw new HttpError(404, 'Note introuvable.');
    res.json(rows[0]);
  })
);

// POST /journal  (création ou mise à jour si id fourni)
journalRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { id, title, body, mood_score, is_shared } = req.body ?? {};
    if (id) {
      const { rows } = await query(
        `update journal_entries
         set title = $1, body = $2, mood_score = $3, is_shared = $4
         where id = $5 and user_id = $6
         returning *`,
        [title ?? '', body ?? '', mood_score ?? null, is_shared ?? false, id, req.user.id]
      );
      if (!rows[0]) throw new HttpError(404, 'Note introuvable.');
      return res.json(rows[0]);
    }
    const { rows } = await query(
      `insert into journal_entries (user_id, title, body, mood_score, is_shared)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [req.user.id, title ?? '', body ?? '', mood_score ?? null, is_shared ?? false]
    );
    res.status(201).json(rows[0]);
  })
);

// DELETE /journal/:id
journalRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await query('delete from journal_entries where id = $1 and user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    res.status(204).end();
  })
);
