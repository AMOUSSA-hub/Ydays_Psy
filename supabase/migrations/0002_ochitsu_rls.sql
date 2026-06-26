-- ============================================================================
-- Ochitsu — Schéma Supabase complet avec Row Level Security (RLS)
-- À exécuter dans Supabase > SQL Editor (sur un projet vierge).
-- Idempotent : peut être rejoué sans danger.
-- ============================================================================

create extension if not exists pgcrypto;

-- ─── Fonctions utilitaires ───────────────────────────────────────────────────

-- Génère un code d'invitation unique à 6 caractères (sans caractères ambigus).
create or replace function public.gen_invite_code()
returns text as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where invite_code = code);
  end loop;
  return code;
end;
$$ language plpgsql;

-- Met à jour updated_at.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── Profils (1:1 avec auth.users) ───────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  role         text not null check (role in ('patient', 'professional')) default 'patient',
  display_name text,
  invite_code  text unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Crée le profil automatiquement à l'inscription (lit role/display_name des métadonnées).
create or replace function public.handle_new_user()
returns trigger as $$
declare
  r text := coalesce(new.raw_user_meta_data->>'role', 'patient');
begin
  insert into public.profiles (id, email, role, display_name, invite_code)
  values (
    new.id,
    new.email,
    case when r = 'professional' then 'professional' else 'patient' end,
    new.raw_user_meta_data->>'display_name',
    case when r = 'professional' then public.gen_invite_code() else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── Liaison patient ↔ professionnel ─────────────────────────────────────────
create table if not exists public.patient_professional_links (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references auth.users (id) on delete cascade,
  professional_id uuid not null references auth.users (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (patient_id, professional_id)
);
create index if not exists idx_links_pro on public.patient_professional_links (professional_id);
create index if not exists idx_links_pat on public.patient_professional_links (patient_id);

-- Vérifie que l'utilisateur courant est un professionnel relié à `patient`.
-- security definer pour contourner la RLS de la table de liens (évite la récursion).
create or replace function public.is_linked_professional(patient uuid)
returns boolean as $$
  select exists (
    select 1 from public.patient_professional_links l
    where l.patient_id = patient and l.professional_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

-- ─── Journal ─────────────────────────────────────────────────────────────────
create table if not exists public.journal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null default '',
  body       text not null default '',
  mood_score int check (mood_score between 1 and 5),
  image_data text,
  is_shared  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_journal_user on public.journal_entries (user_id);
drop trigger if exists journal_updated_at on public.journal_entries;
create trigger journal_updated_at before update on public.journal_entries
  for each row execute function public.set_updated_at();

-- ─── Humeur ──────────────────────────────────────────────────────────────────
create table if not exists public.mood_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  logged_date date not null,
  mood_score  int not null check (mood_score between 1 and 5),
  note        text,
  is_shared   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, logged_date)
);
create index if not exists idx_mood_user on public.mood_logs (user_id);

-- ─── Questionnaires ──────────────────────────────────────────────────────────
create table if not exists public.questionnaires (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text,
  schema      jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists public.questionnaire_submissions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  questionnaire_id uuid not null references public.questionnaires (id) on delete cascade,
  answers          jsonb not null default '{}',
  score            int,
  summary          text,
  is_shared        boolean not null default true,
  created_at       timestamptz not null default now()
);
create index if not exists idx_subm_user on public.questionnaire_submissions (user_id);

-- ─── Activités ───────────────────────────────────────────────────────────────
create table if not exists public.activities (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  type             text not null check (type in ('breathing', 'meditation', 'tips')),
  duration_seconds int,
  body             text,
  audio_url        text,
  created_at       timestamptz not null default now()
);

create table if not exists public.activity_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  activity_id  uuid not null references public.activities (id) on delete cascade,
  completed_at timestamptz not null default now()
);
create index if not exists idx_sess_user on public.activity_sessions (user_id);

-- ─── Rappels ─────────────────────────────────────────────────────────────────
create table if not exists public.reminders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  title           text not null,
  body            text,
  scheduled_at    timestamptz not null,
  recurrence      text,
  enabled         boolean not null default true,
  notification_id text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_rem_user on public.reminders (user_id);

-- ─── Contacts d'aide ─────────────────────────────────────────────────────────
create table if not exists public.help_contacts (
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

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles                   enable row level security;
alter table public.patient_professional_links enable row level security;
alter table public.journal_entries            enable row level security;
alter table public.mood_logs                  enable row level security;
alter table public.questionnaires             enable row level security;
alter table public.questionnaire_submissions  enable row level security;
alter table public.activities                 enable row level security;
alter table public.activity_sessions          enable row level security;
alter table public.reminders                  enable row level security;
alter table public.help_contacts              enable row level security;

-- ── profiles ────────────────────────────────────────────────────────────────
drop policy if exists profiles_select_own    on public.profiles;
drop policy if exists profiles_select_pro    on public.profiles;
drop policy if exists profiles_select_linked on public.profiles;
drop policy if exists profiles_update_own    on public.profiles;
drop policy if exists profiles_insert_own    on public.profiles;
create policy profiles_select_own    on public.profiles for select to authenticated using (auth.uid() = id);
-- Lecture des profils professionnels (pour retrouver un pro via son code d'invitation).
create policy profiles_select_pro    on public.profiles for select to authenticated using (role = 'professional');
-- Un professionnel lit les profils de ses patients reliés.
create policy profiles_select_linked on public.profiles for select to authenticated using (public.is_linked_professional(id));
create policy profiles_update_own    on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_insert_own    on public.profiles for insert to authenticated with check (auth.uid() = id);

-- ── patient_professional_links ──────────────────────────────────────────────
drop policy if exists links_select on public.patient_professional_links;
drop policy if exists links_insert on public.patient_professional_links;
drop policy if exists links_delete on public.patient_professional_links;
create policy links_select on public.patient_professional_links for select to authenticated
  using (patient_id = auth.uid() or professional_id = auth.uid());
create policy links_insert on public.patient_professional_links for insert to authenticated
  with check (patient_id = auth.uid());
create policy links_delete on public.patient_professional_links for delete to authenticated
  using (patient_id = auth.uid());

-- ── journal_entries ─────────────────────────────────────────────────────────
drop policy if exists journal_select on public.journal_entries;
drop policy if exists journal_insert on public.journal_entries;
drop policy if exists journal_update on public.journal_entries;
drop policy if exists journal_delete on public.journal_entries;
create policy journal_select on public.journal_entries for select to authenticated
  using (auth.uid() = user_id or (is_shared and public.is_linked_professional(user_id)));
create policy journal_insert on public.journal_entries for insert to authenticated
  with check (auth.uid() = user_id);
create policy journal_update on public.journal_entries for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy journal_delete on public.journal_entries for delete to authenticated
  using (auth.uid() = user_id);

-- ── mood_logs ───────────────────────────────────────────────────────────────
drop policy if exists mood_select on public.mood_logs;
drop policy if exists mood_insert on public.mood_logs;
drop policy if exists mood_update on public.mood_logs;
create policy mood_select on public.mood_logs for select to authenticated
  using (auth.uid() = user_id or (is_shared and public.is_linked_professional(user_id)));
create policy mood_insert on public.mood_logs for insert to authenticated
  with check (auth.uid() = user_id);
create policy mood_update on public.mood_logs for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── questionnaire_submissions ───────────────────────────────────────────────
drop policy if exists subm_select on public.questionnaire_submissions;
drop policy if exists subm_insert on public.questionnaire_submissions;
create policy subm_select on public.questionnaire_submissions for select to authenticated
  using (auth.uid() = user_id or (is_shared and public.is_linked_professional(user_id)));
create policy subm_insert on public.questionnaire_submissions for insert to authenticated
  with check (auth.uid() = user_id);

-- ── activity_sessions ───────────────────────────────────────────────────────
drop policy if exists sess_select on public.activity_sessions;
drop policy if exists sess_insert on public.activity_sessions;
create policy sess_select on public.activity_sessions for select to authenticated using (auth.uid() = user_id);
create policy sess_insert on public.activity_sessions for insert to authenticated with check (auth.uid() = user_id);

-- ── reminders (le pro relié les voit comme rendez-vous) ─────────────────────
drop policy if exists rem_select on public.reminders;
drop policy if exists rem_insert on public.reminders;
drop policy if exists rem_update on public.reminders;
drop policy if exists rem_delete on public.reminders;
create policy rem_select on public.reminders for select to authenticated
  using (auth.uid() = user_id or public.is_linked_professional(user_id));
create policy rem_insert on public.reminders for insert to authenticated with check (auth.uid() = user_id);
create policy rem_update on public.reminders for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rem_delete on public.reminders for delete to authenticated using (auth.uid() = user_id);

-- ── Référentiels en lecture seule pour tout utilisateur connecté ────────────
drop policy if exists questionnaires_select on public.questionnaires;
drop policy if exists activities_select     on public.activities;
drop policy if exists help_select           on public.help_contacts;
create policy questionnaires_select on public.questionnaires for select to authenticated using (true);
create policy activities_select     on public.activities     for select to authenticated using (true);
create policy help_select           on public.help_contacts  for select to authenticated using (true);

-- ============================================================================
-- DONNÉES DE RÉFÉRENCE (questionnaires, activités, contacts) — aucune donnée perso
-- ============================================================================
insert into public.questionnaires (slug, title, description, schema) values
('phq9-lite', 'Bilan rapide (PHQ-9 simplifié)', 'Auto-évaluation courte pour le moral — ne remplace pas un avis médical.',
 '{"questions":[{"id":"q1","text":"Au cours des dernières 2 semaines, vous êtes-vous senti(e) souvent sans plaisir ou intérêt pour faire des choses ?","options":[{"id":"0","label":"Jamais","score":0},{"id":"1","label":"Plusieurs jours","score":1},{"id":"2","label":"Plus de la moitié des jours","score":2},{"id":"3","label":"Presque tous les jours","score":3}]},{"id":"q2","text":"Vous êtes-vous senti(e) souvent déprimé(e), sans moral ?","options":[{"id":"0","label":"Jamais","score":0},{"id":"1","label":"Plusieurs jours","score":1},{"id":"2","label":"Plus de la moitié des jours","score":2},{"id":"3","label":"Presque tous les jours","score":3}]}]}'::jsonb),
('gad7-lite', 'Anxiété (GAD-7 simplifié)', 'Évaluez votre niveau de stress et d''anxiété sur les dernières semaines.',
 '{"questions":[{"id":"q1","text":"Vous êtes-vous senti(e) nerveux(se), anxieux(se) ou sur les nerfs ?","options":[{"id":"0","label":"Jamais","score":0},{"id":"1","label":"Plusieurs jours","score":1},{"id":"2","label":"Plus de la moitié des jours","score":2},{"id":"3","label":"Presque tous les jours","score":3}]},{"id":"q2","text":"Avez-vous été incapable de vous empêcher de vous inquiéter ?","options":[{"id":"0","label":"Jamais","score":0},{"id":"1","label":"Plusieurs jours","score":1},{"id":"2","label":"Plus de la moitié des jours","score":2},{"id":"3","label":"Presque tous les jours","score":3}]}]}'::jsonb),
('sleep-lite', 'Qualité du Sommeil', 'Un court questionnaire pour comprendre vos cycles de repos.',
 '{"questions":[{"id":"q1","text":"Comment évalueriez-vous la qualité de votre sommeil globalement ?","options":[{"id":"0","label":"Très bonne","score":0},{"id":"1","label":"Assez bonne","score":1},{"id":"2","label":"Assez mauvaise","score":2},{"id":"3","label":"Très mauvaise","score":3}]}]}'::jsonb)
on conflict (slug) do update set title = excluded.title, description = excluded.description, schema = excluded.schema;

insert into public.activities (slug, title, type, duration_seconds, body) values
('breath-478', 'Respiration 4-7-8', 'breathing', 120, 'Inspirez 4s, retenez 7s, expirez 8s. Répétez calmement.'),
('meditation-5', 'Méditation guidée (5 min)', 'meditation', 300, 'Asseyez-vous confortablement, fermez les yeux, concentrez-vous sur votre respiration.'),
('tips-sleep', 'Conseils sommeil', 'tips', null, 'Régularité des horaires, lumière tamisée le soir, éviter les écrans avant de dormir.')
on conflict (slug) do update set title = excluded.title, type = excluded.type, duration_seconds = excluded.duration_seconds, body = excluded.body;

insert into public.help_contacts (region, category, title, phone, url, sort_order) values
('FR', 'suicide', 'SAMU — Urgences Médicales', '15', null, -2),
('FR', 'suicide', '112 — Urgence Européenne', '112', null, -1),
('FR', 'suicide', '3114 — Prévention du Suicide', '3114', 'https://www.3114.fr', 0),
('FR', 'general', 'SOS Médecins', '3624', 'https://www.sosmedecins.fr', 1),
('FR', 'general', 'Fil Santé Jeunes', '0800 235 236', 'https://www.filsantejeunes.com', 2),
('FR', 'tca', 'Ligne Anorexie et Boulimie', '09 72 30 13 50', 'https://www.federe.fr', 3)
on conflict (category, title) do nothing;
