import type {
  ActivityRow,
  QuestionnaireRow,
  QuestionnaireSchema,
} from '@/types/database';

export const DEFAULT_PHQ9_SCHEMA: QuestionnaireSchema = {
  questions: [
    {
      id: 'q1',
      text: 'Au cours des dernières 2 semaines, vous êtes-vous senti(e) souvent sans plaisir ou intérêt pour faire des choses ?',
      options: [
        { id: '0', label: 'Jamais', score: 0 },
        { id: '1', label: 'Plusieurs jours', score: 1 },
        { id: '2', label: 'Plus de la moitié des jours', score: 2 },
        { id: '3', label: 'Presque tous les jours', score: 3 },
      ],
    },
    {
      id: 'q2',
      text: 'Vous êtes-vous senti(e) souvent déprimé(e), sans moral ?',
      options: [
        { id: '0', label: 'Jamais', score: 0 },
        { id: '1', label: 'Plusieurs jours', score: 1 },
        { id: '2', label: 'Plus de la moitié des jours', score: 2 },
        { id: '3', label: 'Presque tous les jours', score: 3 },
      ],
    },
  ],
};

export const GAD7_LITE_SCHEMA: QuestionnaireSchema = {
  questions: [
    {
      id: 'q1',
      text: 'Vous êtes-vous senti(e) nerveux(se), anxieux(se) ou sur les nerfs ?',
      options: [
        { id: '0', label: 'Jamais', score: 0 },
        { id: '1', label: 'Plusieurs jours', score: 1 },
        { id: '2', label: 'Plus de la moitié des jours', score: 2 },
        { id: '3', label: 'Presque tous les jours', score: 3 },
      ],
    },
    {
      id: 'q2',
      text: 'Avez-vous été incapable de vous empêcher de vous inquiéter ou de contrôler vos inquiétudes ?',
      options: [
        { id: '0', label: 'Jamais', score: 0 },
        { id: '1', label: 'Plusieurs jours', score: 1 },
        { id: '2', label: 'Plus de la moitié des jours', score: 2 },
        { id: '3', label: 'Presque tous les jours', score: 3 },
      ],
    },
  ],
};

export const SLEEP_LITE_SCHEMA: QuestionnaireSchema = {
  questions: [
    {
      id: 'q1',
      text: 'Comment évalueriez-vous la qualité de votre sommeil globalement ?',
      options: [
        { id: '0', label: 'Très bonne', score: 0 },
        { id: '1', label: 'Assez bonne', score: 1 },
        { id: '2', label: 'Assez mauvaise', score: 2 },
        { id: '3', label: 'Très mauvaise', score: 3 },
      ],
    },
  ],
};

export function getDefaultQuestionnaires(): QuestionnaireRow[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'local-phq9-lite',
      slug: 'phq9-lite',
      title: 'Bilan rapide (PHQ-9 simplifié)',
      description:
        'Auto-évaluation courte pour le moral — ne remplace pas un avis médical.',
      schema: DEFAULT_PHQ9_SCHEMA,
      created_at: now,
    },
    {
      id: 'local-gad7-lite',
      slug: 'gad7-lite',
      title: 'Anxiété (GAD-7 simplifié)',
      description:
        'Évaluez votre niveau de stress et d’anxiété sur les dernières semaines.',
      schema: GAD7_LITE_SCHEMA,
      created_at: now,
    },
    {
      id: 'local-sleep-lite',
      slug: 'sleep-lite',
      title: 'Qualité du Sommeil',
      description:
        'Un court questionnaire pour comprendre vos cycles de repos.',
      schema: SLEEP_LITE_SCHEMA,
      created_at: now,
    },
  ];
}

export function getDefaultActivities(): ActivityRow[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'local-breath',
      slug: 'breath-478',
      title: 'Respiration 4-7-8',
      type: 'breathing',
      duration_seconds: 120,
      body: 'Inspirez 4s, retenez 7s, expirez 8s. Répétez calmement.',
      audio_url: null,
      created_at: now,
    },
    {
      id: 'local-med',
      slug: 'meditation-5',
      title: 'Méditation guidée (5 min)',
      type: 'meditation',
      duration_seconds: 300,
      body: 'Asseyez-vous confortablement, fermez les yeux, concentrez-vous sur votre respiration.',
      audio_url: null,
      created_at: now,
    },
    {
      id: 'local-tips',
      slug: 'tips-sleep',
      title: 'Conseils sommeil',
      type: 'tips',
      duration_seconds: null,
      body: 'Régularité des horaires, lumière tamisée le soir, éviter les écrans avant de dormir.',
      audio_url: null,
      created_at: now,
    },
  ];
}
