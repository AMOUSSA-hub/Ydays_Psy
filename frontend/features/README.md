# Features

Domaines métier organisés par dossier (hooks UI légers, logique dans `lib/repositories.ts` et données dans `data/`).

- `auth` — session via `contexts/auth-context.tsx`
- `journal` — entrées + humeur (`lib/repositories.ts`)
- `questionnaires` — écrans `app/quiz/*`
- `activities` — écrans `app/activities/*`
- `reminders` — notifications locales (`lib/notifications.ts`) + agenda
- `orientation` — contacts d’aide (`phone` + repositories)
