# Ochitsu — Backend (API REST)

API Node.js / Express adossée à **PostgreSQL**, avec authentification **JWT**.
C'est la « source de vérité » de l'application : plus aucune donnée factice.

## Architecture

```
src/
  server.js            point d'entrée (écoute le port)
  app.js               application Express + montage des routes
  db.js                pool PostgreSQL
  schema.sql           schéma de la base (idempotent)
  seed.sql             données de RÉFÉRENCE (questionnaires, activités, contacts)
  migrate.js           applique schema.sql puis seed.sql
  middleware/auth.js   JWT (signature, requireAuth, requireRole)
  routes/
    auth.js            register / login / me
    journal.js         notes de journal (partage par note)
    moods.js           humeur quotidienne
    questionnaires.js  référentiel + bilans soumis
    activities.js      référentiel + séances réalisées
    reminders.js       rappels / agenda
    helpContacts.js    contacts d'aide
    links.js           liaison patient → professionnel (code d'invitation)
    pro.js             espace pro : patients, détail, rendez-vous
```

## Modèle de données

Base **relationnelle (PostgreSQL)** — adaptée à des données structurées, fortement
reliées, et soumises à des règles de confidentialité (données de santé).

- `users` (patients et professionnels, avec `invite_code` pour les pros)
- `patient_professional_links` (qui partage avec qui)
- `journal_entries` (`is_shared` par note), `mood_logs` (`is_shared`, partagé par défaut)
- `questionnaires` / `questionnaire_submissions` (`is_shared`)
- `activities` / `activity_sessions`, `reminders`, `help_contacts`

Le contrôle d'accès est appliqué dans l'API : un professionnel ne lit que les
données **partagées** des patients qui l'ont relié via son code d'invitation.

## Démarrage

```bash
cd backend
cp .env.example .env          # ajuste si besoin

# 1) Base de données PostgreSQL
docker compose up -d          # (ou utilise ta propre instance et adapte DATABASE_URL)

# 2) Dépendances + schéma + données de référence
npm install
npm run migrate

# 3) Lancer l'API
npm run dev                   # http://localhost:4000  (npm start en prod)
```

Vérifier : `curl http://localhost:4000/health` → `{"ok":true}`

## Principales routes

| Méthode | Route | Auth | Rôle |
|---|---|---|---|
| POST | `/auth/register` `/auth/login` | – | – |
| GET | `/auth/me` | JWT | – |
| GET/POST/DELETE | `/journal` | JWT | patient |
| GET/POST | `/moods` | JWT | patient |
| GET/POST | `/questionnaires` `/questionnaires/submissions` | JWT | – |
| GET/POST | `/activities` `/activities/sessions` | JWT | – |
| GET/POST/DELETE | `/reminders` | JWT | – |
| GET | `/help-contacts` | JWT | – |
| GET/POST/DELETE | `/links` `/links/professional` | JWT | patient |
| GET | `/pro/invite-code` `/pro/patients` `/pro/patients/:id` `/pro/appointments` | JWT | professional |

## Lien avec le frontend

Le frontend pointe vers cette API via `EXPO_PUBLIC_API_URL` (voir `frontend/.env.example`).
