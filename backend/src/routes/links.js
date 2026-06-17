import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/async-handler.js';

export const linksRouter = Router();
linksRouter.use(requireAuth);

// GET /links/professional  → le professionnel lié au patient (ou null)
linksRouter.get(
  '/professional',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `select u.id, u.display_name, u.email
       from patient_professional_links l
       join users u on u.id = l.professional_id
       where l.patient_id = $1
       order by l.created_at desc
       limit 1`,
      [req.user.id]
    );
    res.json({ professional: rows[0] ?? null });
  })
);

// POST /links  { code }  → relie le patient au professionnel possédant ce code
linksRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'patient') throw new HttpError(403, 'Seul un patient peut se relier à un professionnel.');
    const code = (req.body?.code ?? '').trim().toUpperCase();
    if (!code) throw new HttpError(400, "Code d'invitation requis.");

    const { rows } = await query(
      "select id, display_name, email from users where invite_code = $1 and role = 'professional'",
      [code]
    );
    const pro = rows[0];
    if (!pro) throw new HttpError(404, "Code d'invitation invalide.");

    await query(
      `insert into patient_professional_links (patient_id, professional_id)
       values ($1, $2)
       on conflict (patient_id, professional_id) do nothing`,
      [req.user.id, pro.id]
    );

    res.status(201).json({ professional: pro });
  })
);

// DELETE /links/:professionalId  → révoque le partage
linksRouter.delete(
  '/:professionalId',
  asyncHandler(async (req, res) => {
    await query(
      'delete from patient_professional_links where patient_id = $1 and professional_id = $2',
      [req.user.id, req.params.professionalId]
    );
    res.status(204).end();
  })
);
