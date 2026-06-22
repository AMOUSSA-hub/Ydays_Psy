# Configuration Supabase — Ochitsu

L'application utilise **Supabase** : authentification (Supabase Auth) et base de
données **PostgreSQL** avec **Row Level Security (RLS)**. Le partage patient↔pro
est appliqué directement par les politiques RLS (un professionnel ne lit que les
lignes `is_shared` des patients qui l'ont relié).

## 1. Créer le projet Supabase

1. Créer un compte sur [supabase.com](https://supabase.com) et un nouveau projet.
2. Noter, dans **Project Settings > API** :
   - **Project URL** (ex. `https://xxxx.supabase.co`)
   - **anon public key**

## 2. Créer le schéma + les politiques RLS

1. Ouvrir **SQL Editor** dans le dashboard.
2. Copier-coller le contenu de [`supabase/migrations/0002_ochitsu_rls.sql`](../supabase/migrations/0002_ochitsu_rls.sql).
3. Exécuter (**Run**). Le script crée les **10 tables**, les **fonctions**, le
   **trigger** de création de profil, **toutes les politiques RLS**, et insère les
   **données de référence** (questionnaires, activités, contacts). Il est idempotent.

## 3. Désactiver la confirmation d'email (dev)

Dans **Authentication > Providers > Email**, désactiver **« Confirm email »**.
Sans cela, l'inscription ne crée pas de session immédiate et la connexion échoue
tant que l'email n'est pas confirmé.

> La méthode **Email/Password** est activée par défaut.

## 4. Configurer l'application

```bash
cd frontend
cp .env.example .env
```

Renseigner dans `frontend/.env` :

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Puis :

```bash
npm install
npm start        # "w" pour le web
```

## 5. Modèle de sécurité (RLS)

| Table | Politique de lecture |
|---|---|
| `journal_entries`, `mood_logs`, `questionnaire_submissions` | propriétaire **OU** (`is_shared` **ET** pro relié) |
| `reminders` | propriétaire **OU** pro relié (rendez-vous) |
| `profiles` | soi-même **OU** `role='professional'` (lookup code) **OU** patient relié |
| `patient_professional_links` | patient ou professionnel concerné |
| `questionnaires`, `activities`, `help_contacts` | tout utilisateur connecté (référentiel) |

L'écriture est toujours réservée au propriétaire (`auth.uid() = user_id`). La
fonction `is_linked_professional(patient)` (security definer) implémente le test
« le pro courant est-il relié à ce patient ? ».

## 6. Scénario de test

1. Créer un compte **Professionnel** → onglet Profil : noter le **code d'invitation**.
2. Créer un compte **Patient**.
3. Patient : enregistrer une humeur, écrire une note (Partager = Oui) **et** une note privée, faire un quiz.
4. Patient → Profil : saisir le **code** du pro → « Relier mon médecin ».
5. Se connecter en **Pro** : le patient apparaît avec ses données partagées
   (la note privée reste invisible). Un pro **non relié** ne voit rien (RLS).

## Dépannage

- **Connexion impossible après inscription** → la confirmation d'email est encore active (étape 3).
- **Le pro ne voit aucune donnée** → vérifier que la liaison (code) a bien eu lieu,
  et que les données sont `is_shared` (l'humeur et les bilans le sont par défaut ;
  une note de journal doit être marquée « Partager = Oui »).
- **`new row violates row-level security policy`** → l'utilisateur tente d'écrire
  pour un `user_id` différent du sien (ne devrait pas arriver via l'app).
