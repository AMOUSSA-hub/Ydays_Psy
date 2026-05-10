# Ydays Psy - Frontend

Application React Native (Expo) avec support **mobile** et **web** (barre d’onglets en bas sur mobile, barre latérale à gauche sur web).

## Prérequis

- Node.js 20 LTS recommandé
- npm 10+
- Expo Go sur mobile (optionnel)

## Installation

```bash
npm install
```

Copier la configuration (optionnel si vous utilisez Supabase) :

```bash
copy .env.example .env
```

Renseigner `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` depuis le tableau de bord Supabase.  
Sans ces variables, l’app fonctionne en **mode local** (données AsyncStorage sur l’appareil).

Dans Supabase : **Authentication → Providers → Anonymous** doit être activé pour le mode invité cloud ; sinon utilisez uniquement le mode local ou email/mot de passe.

Le schéma SQL de référence est dans `../supabase/migrations/001_initial.sql` (à exécuter dans l’éditeur SQL Supabase).

## Lancement

### Développement

```bash
npm run start
```

### Web

```bash
npm run web
```

### Android / iOS

```bash
npm run android
npm run ios
```

## Parcours démo (soutenance)

1. Écran **Bienvenue** → connexion, inscription, **mode anonyme**, ou flux « Commencer ».
2. **Accueil** : citation, semaine + humeurs, raccourcis Journal / Quizz / compagnon / activités.
3. **Agenda** : humeur du jour (1–5), rappels rapides, liste des rappels (notifications locales sur mobile).
4. **Journal** : création / édition d’entrées (stockage local ou Supabase).
5. **Quizz** : questionnaire PHQ-9 simplifié avec retour indicatif.
6. **Activités** : respiration / méditation / conseils avec minuteur.
7. **Appel** : lignes d’écoute (3114, TCA, etc.).
8. **Réglages** : **jour / nuit / automatique**, confidentialité, déconnexion.

## Structure utile

- `app/` : routes Expo Router
- `app/(tabs)/` : onglets principaux
- `lib/repositories.ts` : accès données (Supabase ou magasin local)
- `lib/supabase.ts` : client Supabase
- `contexts/` : auth, préférences de thème
- `supabase/migrations/` : SQL à appliquer côté projet Supabase

## Notes techniques

- Style : **NativeWind** (Tailwind).
- Thème : **React Navigation** + préférences persistées (`ThemePreferenceProvider`).
- Notifications : **expo-notifications** (rappels ; sur web, liste dans l’agenda uniquement).
