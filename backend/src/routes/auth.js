import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/async-handler.js';

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sans caractères ambigus

function generateInviteCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    display_name: row.display_name,
    invite_code: row.invite_code ?? null,
  };
}

// POST /auth/register
authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, role, display_name } = req.body ?? {};
    if (!email || !EMAIL_RE.test(email)) throw new HttpError(400, 'Email invalide.');
    if (!password || password.length < 6) throw new HttpError(400, 'Mot de passe trop court (6 caractères min).');
    const normalizedRole = role === 'professional' ? 'professional' : 'patient';

    const existing = await query('select id from users where email = $1', [email.toLowerCase()]);
    if (existing.rowCount > 0) throw new HttpError(409, 'Un compte existe déjà avec cet email.');

    const passwordHash = await bcrypt.hash(password, 10);

    // Code d'invitation unique pour les professionnels.
    let inviteCode = null;
    if (normalizedRole === 'professional') {
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateInviteCode();
        const taken = await query('select 1 from users where invite_code = $1', [candidate]);
        if (taken.rowCount === 0) {
          inviteCode = candidate;
          break;
        }
      }
    }

    const { rows } = await query(
      `insert into users (email, password_hash, role, display_name, invite_code)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [email.toLowerCase(), passwordHash, normalizedRole, display_name ?? null, inviteCode]
    );

    const user = rows[0];
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  })
);

// POST /auth/login
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) throw new HttpError(400, 'Email et mot de passe requis.');

    const { rows } = await query('select * from users where email = $1', [email.toLowerCase()]);
    const user = rows[0];
    if (!user) throw new HttpError(401, 'Email ou mot de passe incorrect.');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new HttpError(401, 'Email ou mot de passe incorrect.');

    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

// GET /auth/me
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query('select * from users where id = $1', [req.user.id]);
    const user = rows[0];
    if (!user) throw new HttpError(404, 'Utilisateur introuvable.');
    res.json({ user: publicUser(user) });
  })
);
