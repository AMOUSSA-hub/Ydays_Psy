-- Ydays Psy — schéma initial (à appliquer dans Supabase SQL Editor ou CLI)

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (1:1 auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  theme_preference text check (theme_preference in ('light', 'dark', 'system')) default 'system',
  consent_privacy_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Journal
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

drop trigger if exists journal_entries_updated_at on public.journal_entries;
create trigger journal_entries_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

-- Mood
create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_date date not null,
  mood_score int not null check (mood_score between 1 and 5),
  note text,
  created_at timestamptz default now() not null,
  unique (user_id, logged_date)
);

-- Questionnaires
create table if not exists public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  schema jsonb not null default '{}',
  created_at timestamptz default now() not null
);

create table if not exists public.questionnaire_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  questionnaire_id uuid not null references public.questionnaires (id) on delete cascade,
  answers jsonb not null default '{}',
  score int,
  summary text,
  created_at timestamptz default now() not null
);

-- Activities
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  type text not null check (type in ('breathing', 'meditation', 'tips')),
  duration_seconds int,
  body text,
  audio_url text,
  created_at timestamptz default now() not null
);

create table if not exists public.activity_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_id uuid not null references public.activities (id) on delete cascade,
  completed_at timestamptz default now() not null
);

-- Reminders
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text,
  scheduled_at timestamptz not null,
  recurrence text,
  enabled boolean default true not null,
  notification_id text,
  created_at timestamptz default now() not null
);

-- Help / orientation (données relativement publiques)
create table if not exists public.help_contacts (
  id uuid primary key default gen_random_uuid(),
  region text,
  category text not null,
  title text not null,
  phone text,
  url text,
  sort_order int default 0,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;
alter table public.journal_entries enable row level security;
alter table public.mood_logs enable row level security;
alter table public.questionnaire_submissions enable row level security;
alter table public.activity_sessions enable row level security;
alter table public.reminders enable row level security;

-- policies profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- journal
create policy "journal_select_own" on public.journal_entries for select using (auth.uid() = user_id);
create policy "journal_insert_own" on public.journal_entries for insert with check (auth.uid() = user_id);
create policy "journal_update_own" on public.journal_entries for update using (auth.uid() = user_id);
create policy "journal_delete_own" on public.journal_entries for delete using (auth.uid() = user_id);

-- mood
create policy "mood_select_own" on public.mood_logs for select using (auth.uid() = user_id);
create policy "mood_insert_own" on public.mood_logs for insert with check (auth.uid() = user_id);
create policy "mood_update_own" on public.mood_logs for update using (auth.uid() = user_id);
create policy "mood_delete_own" on public.mood_logs for delete using (auth.uid() = user_id);

-- questionnaire submissions
create policy "qsub_select_own" on public.questionnaire_submissions for select using (auth.uid() = user_id);
create policy "qsub_insert_own" on public.questionnaire_submissions for insert with check (auth.uid() = user_id);

-- questionnaires read for authenticated
create policy "questionnaires_select_auth" on public.questionnaires for select to authenticated using (true);

-- activity sessions
create policy "asess_select_own" on public.activity_sessions for select using (auth.uid() = user_id);
create policy "asess_insert_own" on public.activity_sessions for insert with check (auth.uid() = user_id);

-- activities read
create policy "activities_select_auth" on public.activities for select to authenticated using (true);

-- reminders
create policy "rem_select_own" on public.reminders for select using (auth.uid() = user_id);
create policy "rem_insert_own" on public.reminders for insert with check (auth.uid() = user_id);
create policy "rem_update_own" on public.reminders for update using (auth.uid() = user_id);
create policy "rem_delete_own" on public.reminders for delete using (auth.uid() = user_id);

-- help contacts public read
alter table public.questionnaires enable row level security;
alter table public.activities enable row level security;
alter table public.help_contacts enable row level security;
create policy "help_select_all" on public.help_contacts for select to authenticated using (true);

-- Trigger: créer profile à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed minimal (à adapter)
insert into public.questionnaires (slug, title, description, schema)
values (
  'phq9-lite',
  'Bilan rapide (PHQ-9 simplifié)',
  'Auto-évaluation courte — ne remplace pas un avis médical.',
  '{"questions":[{"id":"q1","text":"Au cours des dernières 2 semaines, vous êtes-vous senti(e) souvent sans plaisir ou intérêt pour faire des choses ?","options":[{"id":"0","label":"Jamais","score":0},{"id":"1","label":"Plusieurs jours","score":1},{"id":"2","label":"Plus de la moitié des jours","score":2},{"id":"3","label":"Presque tous les jours","score":3}]},{"id":"q2","text":"Vous êtes-vous senti(e) souvent déprimé(e), sans moral ?","options":[{"id":"0","label":"Jamais","score":0},{"id":"1","label":"Plusieurs jours","score":1},{"id":"2","label":"Plus de la moitié des jours","score":2},{"id":"3","label":"Presque tous les jours","score":3}]}]}'::jsonb
)
on conflict (slug) do nothing;

insert into public.activities (slug, title, type, duration_seconds, body)
values
  ('breath-478', 'Respiration 4-7-8', 'breathing', 120, 'Inspirez 4s, retenez 7s, expirez 8s. Répétez calmement.'),
  ('meditation-5', 'Méditation guidée (5 min)', 'meditation', 300, 'Asseyez-vous confortablement, fermez les yeux, concentrez-vous sur votre respiration.'),
  ('tips-sleep', 'Conseils sommeil', 'tips', null, 'Régularité des horaires, lumière tamisée le soir, éviter les écrans avant de dormir.')
on conflict (slug) do nothing;

insert into public.help_contacts (region, category, title, phone, url, sort_order)
select * from (values
  ('FR'::text, 'suicide'::text, '3114 — Prévention suicide'::text, '3114'::text, 'https://www.3114.fr'::text, 0),
  ('FR', 'general', 'Fil Santé Jeunes', '0800 235 236', 'https://www.filsantejeunes.com', 1),
  ('FR', 'tca', 'Ligne TCA — ANAD', '09 72 30 13 50', 'https://www.federe.fr', 2)
) as v(region, category, title, phone, url, sort_order)
where not exists (select 1 from public.help_contacts limit 1);
