-- Schéma PostgreSQL pour Ochitsu (API custom).
-- Idempotent : peut être rejoué sans danger.

create extension if not exists "pgcrypto";

-- ─── Utilisateurs (patients et professionnels) ────────────────────────────────
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  role          text not null check (role in ('patient', 'professional')) default 'patient',
  display_name  text,
  -- Code d'invitation : présent uniquement pour les professionnels.
  invite_code   text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Lien patient ↔ professionnel ─────────────────────────────────────────────
create table if not exists patient_professional_links (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references users (id) on delete cascade,
  professional_id uuid not null references users (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (patient_id, professional_id)
);

create index if not exists idx_links_professional on patient_professional_links (professional_id);
create index if not exists idx_links_patient on patient_professional_links (patient_id);

-- ─── Journal intime ───────────────────────────────────────────────────────────
create table if not exists journal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users (id) on delete cascade,
  title      text not null default '',
  body       text not null default '',
  mood_score int check (mood_score between 1 and 5),
  -- Partagé ou non avec le professionnel (choix du patient par note).
  is_shared  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_journal_user on journal_entries (user_id);

-- ─── Humeur quotidienne ───────────────────────────────────────────────────────
create table if not exists mood_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users (id) on delete cascade,
  logged_date date not null,
  mood_score  int not null check (mood_score between 1 and 5),
  note        text,
  -- L'humeur est partagée par défaut (matière à discussion lors des RDV).
  is_shared   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, logged_date)
);

create index if not exists idx_mood_user on mood_logs (user_id);

-- ─── Questionnaires (données de référence) ────────────────────────────────────
create table if not exists questionnaires (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text,
  schema      jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists questionnaire_submissions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users (id) on delete cascade,
  questionnaire_id uuid not null references questionnaires (id) on delete cascade,
  answers          jsonb not null default '{}',
  score            int,
  summary          text,
  is_shared        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists idx_submissions_user on questionnaire_submissions (user_id);

-- ─── Activités (respiration, méditation, conseils) ────────────────────────────
create table if not exists activities (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  type             text not null check (type in ('breathing', 'meditation', 'tips')),
  duration_seconds int,
  body             text,
  audio_url        text,
  created_at       timestamptz not null default now()
);

create table if not exists activity_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users (id) on delete cascade,
  activity_id  uuid not null references activities (id) on delete cascade,
  completed_at timestamptz not null default now()
);

create index if not exists idx_sessions_user on activity_sessions (user_id);

-- ─── Rappels / agenda ─────────────────────────────────────────────────────────
create table if not exists reminders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users (id) on delete cascade,
  title           text not null,
  body            text,
  scheduled_at    timestamptz not null,
  recurrence      text,
  enabled         boolean not null default true,
  notification_id text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_reminders_user on reminders (user_id);

-- ─── Contacts d'aide (données de référence publiques) ─────────────────────────
create table if not exists help_contacts (
  id         uuid primary key default gen_random_uuid(),
  region     text,
  category   text not null,
  title      text not null,
  phone      text,
  url        text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (category, title)
);

-- Trigger updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_updated_at on users;
create trigger users_updated_at before update on users
  for each row execute function set_updated_at();

drop trigger if exists journal_updated_at on journal_entries;
create trigger journal_updated_at before update on journal_entries
  for each row execute function set_updated_at();
