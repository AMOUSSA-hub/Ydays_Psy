import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { authRouter } from './routes/auth.js';
import { journalRouter } from './routes/journal.js';
import { moodsRouter } from './routes/moods.js';
import { questionnairesRouter } from './routes/questionnaires.js';
import { activitiesRouter } from './routes/activities.js';
import { remindersRouter } from './routes/reminders.js';
import { helpContactsRouter } from './routes/helpContacts.js';
import { linksRouter } from './routes/links.js';
import { proRouter } from './routes/pro.js';

export function createApp() {
  const app = express();

  const origins = process.env.CORS_ORIGIN || '*';
  app.use(cors({ origin: origins === '*' ? true : origins.split(',').map((s) => s.trim()) }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/auth', authRouter);
  app.use('/journal', journalRouter);
  app.use('/moods', moodsRouter);
  app.use('/questionnaires', questionnairesRouter);
  app.use('/activities', activitiesRouter);
  app.use('/reminders', remindersRouter);
  app.use('/help-contacts', helpContactsRouter);
  app.use('/links', linksRouter);
  app.use('/pro', proRouter);

  // 404
  app.use((_req, res) => res.status(404).json({ error: 'Route introuvable.' }));

  // Gestionnaire d'erreurs centralisé
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (status >= 500) console.error('[error]', err);
    res.status(status).json({ error: err.message || 'Erreur serveur.' });
  });

  return app;
}
