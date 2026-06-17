import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';

export const helpContactsRouter = Router();
helpContactsRouter.use(requireAuth);

// GET /help-contacts  (référentiel public, accessible aux utilisateurs connectés)
helpContactsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await query('select * from help_contacts order by sort_order');
    res.json(rows);
  })
);
