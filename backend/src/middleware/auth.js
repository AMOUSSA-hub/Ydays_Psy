import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/async-handler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '30d';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/** Vérifie le JWT et place { id, role } sur req.user. */
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Authentification requise.'));
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, 'Session invalide ou expirée.'));
  }
}

/** Restreint l'accès à un rôle donné (à utiliser après requireAuth). */
export function requireRole(role) {
  return (req, _res, next) => {
    if (req.user?.role !== role) {
      return next(new HttpError(403, 'Accès réservé.'));
    }
    next();
  };
}
