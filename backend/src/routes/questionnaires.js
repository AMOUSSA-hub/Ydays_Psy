import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/async-handler.js';

export const questionnairesRouter = Router();
questionnairesRouter.use(requireAuth);

// GET /questionnaires  (référentiel)
questionnairesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await query('select * from questionnaires order by created_at');
    res.json(rows);
  })
);

// GET /questionnaires/submissions  (mes bilans)
questionnairesRouter.get(
  '/submissions',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select * from questionnaire_submissions where user_id = $1 order by created_at desc',
      [req.user.id]
    );
    res.json(rows);
  })
);

// POST /questionnaires/submissions  (enregistrer un bilan)
questionnairesRouter.post(
  '/submissions',
  asyncHandler(async (req, res) => {
    const { questionnaire_id, answers, score, summary, is_shared } = req.body ?? {};
    if (!questionnaire_id) throw new HttpError(400, 'Questionnaire requis.');
    const { rows } = await query(
      `insert into questionnaire_submissions (user_id, questionnaire_id, answers, score, summary, is_shared)
       values ($1, $2, $3, $4, $5, $6)
       returning *`,
      [
        req.user.id,
        questionnaire_id,
        answers ?? {},
        score ?? null,
        summary ?? null,
        is_shared ?? true,
      ]
    );
    res.status(201).json(rows[0]);
  })
);
