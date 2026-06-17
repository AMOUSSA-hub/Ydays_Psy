-- Données de RÉFÉRENCE uniquement (questionnaires, activités, contacts d'aide).
-- Aucun patient ni donnée personnelle factice n'est inséré ici.
-- Idempotent grâce à ON CONFLICT (slug / unique).

-- ─── Questionnaires ────────────────────────────────────────────────────────────
insert into questionnaires (slug, title, description, schema) values
(
  'phq9-lite',
  'Bilan rapide (PHQ-9 simplifié)',
  'Auto-évaluation courte pour le moral — ne remplace pas un avis médical.',
  '{"questions":[{"id":"q1","text":"Au cours des dernières 2 semaines, vous êtes-vous senti(e) souvent sans plaisir ou intérêt pour faire des choses ?","options":[{"id":"0","label":"Jamais","score":0},{"id":"1","label":"Plusieurs jours","score":1},{"id":"2","label":"Plus de la moitié des jours","score":2},{"id":"3","label":"Presque tous les jours","score":3}]},{"id":"q2","text":"Vous êtes-vous senti(e) souvent déprimé(e), sans moral ?","options":[{"id":"0","label":"Jamais","score":0},{"id":"1","label":"Plusieurs jours","score":1},{"id":"2","label":"Plus de la moitié des jours","score":2},{"id":"3","label":"Presque tous les jours","score":3}]}]}'::jsonb
),
(
  'gad7-lite',
  'Anxiété (GAD-7 simplifié)',
  'Évaluez votre niveau de stress et d''anxiété sur les dernières semaines.',
  '{"questions":[{"id":"q1","text":"Vous êtes-vous senti(e) nerveux(se), anxieux(se) ou sur les nerfs ?","options":[{"id":"0","label":"Jamais","score":0},{"id":"1","label":"Plusieurs jours","score":1},{"id":"2","label":"Plus de la moitié des jours","score":2},{"id":"3","label":"Presque tous les jours","score":3}]},{"id":"q2","text":"Avez-vous été incapable de vous empêcher de vous inquiéter ou de contrôler vos inquiétudes ?","options":[{"id":"0","label":"Jamais","score":0},{"id":"1","label":"Plusieurs jours","score":1},{"id":"2","label":"Plus de la moitié des jours","score":2},{"id":"3","label":"Presque tous les jours","score":3}]}]}'::jsonb
),
(
  'sleep-lite',
  'Qualité du Sommeil',
  'Un court questionnaire pour comprendre vos cycles de repos.',
  '{"questions":[{"id":"q1","text":"Comment évalueriez-vous la qualité de votre sommeil globalement ?","options":[{"id":"0","label":"Très bonne","score":0},{"id":"1","label":"Assez bonne","score":1},{"id":"2","label":"Assez mauvaise","score":2},{"id":"3","label":"Très mauvaise","score":3}]}]}'::jsonb
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  schema = excluded.schema;

-- ─── Activités ─────────────────────────────────────────────────────────────────
insert into activities (slug, title, type, duration_seconds, body) values
  ('breath-478', 'Respiration 4-7-8', 'breathing', 120, 'Inspirez 4s, retenez 7s, expirez 8s. Répétez calmement.'),
  ('meditation-5', 'Méditation guidée (5 min)', 'meditation', 300, 'Asseyez-vous confortablement, fermez les yeux, concentrez-vous sur votre respiration.'),
  ('tips-sleep', 'Conseils sommeil', 'tips', null, 'Régularité des horaires, lumière tamisée le soir, éviter les écrans avant de dormir.')
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  duration_seconds = excluded.duration_seconds,
  body = excluded.body;

-- ─── Contacts d'aide ───────────────────────────────────────────────────────────
insert into help_contacts (region, category, title, phone, url, sort_order) values
  ('FR', 'suicide', 'SAMU — Urgences Médicales', '15', null, -2),
  ('FR', 'suicide', '112 — Urgence Européenne', '112', null, -1),
  ('FR', 'suicide', '3114 — Prévention du Suicide', '3114', 'https://www.3114.fr', 0),
  ('FR', 'general', 'SOS Médecins', '3624', 'https://www.sosmedecins.fr', 1),
  ('FR', 'general', 'Fil Santé Jeunes', '0800 235 236', 'https://www.filsantejeunes.com', 2),
  ('FR', 'tca', 'Ligne Anorexie et Boulimie', '09 72 30 13 50', 'https://www.federe.fr', 3)
on conflict (category, title) do nothing;
