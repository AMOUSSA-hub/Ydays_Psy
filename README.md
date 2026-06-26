# Ochitsu 🧘

> **Ochitsu** (落ち着く — « se calmer, s'apaiser » en japonais) est une application
> mobile et web d'accompagnement en **santé mentale**, qui relie un patient à son
> professionnel de santé (psychologue, psychiatre).


---

## 🎯 Le concept

Beaucoup de personnes en souffrance peinent à verbaliser leur état entre deux
rendez-vous, et les praticiens manquent de données objectives sur l'intervalle.

Ochitsu propose un **espace bienveillant et confidentiel** où le patient documente
son quotidien (humeur, journal, auto-évaluations, exercices), et peut — **sur
consentement explicite et de façon granulaire** — partager certaines de ces données
avec son professionnel de santé attitré, pour enrichir la matière à discussion lors
des consultations.

Deux espaces, un seul produit :

- **Espace Patient** : suivi quotidien et bien-être.
- **Espace Professionnel** : suivi des patients reliés et de leurs données partagées.

---

## ✨ Fonctionnalités

### Côté patient
- 📊 **Suivi d'humeur** quotidien (échelle 1–5) avec graphique sur 7 jours
- 📓 **Journal intime** avec partage **par note** (privé par défaut)
- 🧠 **Bilans / quiz** validés : PHQ-9 (dépression), GAD-7 (anxiété), sommeil
- 🌬️ **Exercices** de respiration, méditation, conseils
- 🗓️ **Rituels & rappels** planifiables (notifications locales)
- 🚨 **Urgences** : SAMU (15), 3114, 112… appelables en un geste + géolocalisation des thérapeutes
- 🔗 **Liaison à son médecin** via un code d'invitation

### Côté professionnel
- 👥 **Liste des patients** reliés (humeur récente, tendance, alertes « à surveiller »)
- 📈 **Fiche patient** : graphique d'humeur, bilans, **notes partagées uniquement**
- 📅 **Agenda** des rendez-vous à venir
- 🪪 **Code d'invitation** à communiquer aux patients

---

## 🏗️ Architecture

```
┌──────────────────────────────┐     supabase-js (HTTPS)     ┌──────────────────────────┐
│  Application (React Native)  │ ─────────────────────────▶  │  Supabase                 │
│  Expo Router · iOS/Android/Web│   JWT (session persistée)  │  • Auth (email/password)  │
└──────────────────────────────┘ ◀─────────────────────────  │  • PostgreSQL + RLS        │
                                                              └──────────────────────────┘
```

Le contrôle d'accès (qui voit quoi) est appliqué **en base via les politiques RLS** :
un professionnel ne lit que les données `is_shared` des patients qui l'ont relié.

### Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React Native + **Expo Router** (iOS / Android / Web) |
| Styling | NativeWind (Tailwind CSS) · TypeScript |
| Backend | **Supabase** — Auth + PostgreSQL + Row Level Security |
| Natif | Géolocalisation (`expo-location`), Notifications (`expo-notifications`), Presse-papier (`expo-clipboard`) |

---

## 📁 Structure du dépôt

```
ydays-psy-app/
├── frontend/                  # Application Expo / React Native
│   ├── app/                   # Écrans (Expo Router)
│   │   ├── index.tsx          #   accueil — choix d'espace
│   │   ├── auth.tsx           #   connexion / inscription
│   │   ├── (tabs)/            #   espace patient (home, book, agenda, phone, profile…)
│   │   └── pro/               #   espace professionnel (patients, patient/[id], agenda, profile)
│   ├── lib/                   # supabase.ts, repositories.ts, pro-data.ts, notifications.ts…
│   └── contexts/              # auth-context, theme-preference-context
├── supabase/
│   └── migrations/
│       └── 0002_ochitsu_rls.sql   # schéma + RLS + trigger + données de référence
├── docs/
│   ├── SUPABASE_SETUP.md      # procédure de configuration Supabase
│   └── SPECIFICATIONS.md      # cahier des spécifications complet
└── db-schema.png             # diagramme entité-association
```

---

## 🚀 Démarrage rapide

### 1. Backend Supabase
1. Créer un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécuter [`supabase/migrations/0002_ochitsu_rls.sql`](supabase/migrations/0002_ochitsu_rls.sql).
3. Dans **Authentication → Providers → Email**, désactiver **« Confirm email »**.

> Procédure détaillée : [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

### 2. Application
```bash
cd frontend
cp .env.example .env        # renseigner EXPO_PUBLIC_SUPABASE_URL et _ANON_KEY
npm install
npm start                   # « w » pour le web, ou scanner le QR (Expo Go)
```

### 3. Build APK (Android)
```bash
cd frontend
eas build -p android --profile preview --clear-cache
```
Les variables Supabase sont fournies au build via `eas.json` (profil `preview`).

---

## 🔐 Sécurité & confidentialité

Les données traitées relèvent de la **santé mentale** (données sensibles, RGPD art. 9) :

- Authentification gérée par **Supabase Auth** (mots de passe hachés, jamais exposés).
- **RLS** sur les 10 tables : chacun n'accède qu'à ses données ; le pro lit uniquement
  les données **partagées** de ses patients **reliés**.
- Partage **explicite** (liaison par code + `is_shared`) et **révocable** à tout moment.
- La clé `anon` embarquée dans l'app est **publique par conception** — la sécurité
  repose sur la RLS, pas sur le secret de la clé.

> Pour une mise en production réelle en France : hébergement **HDS** recommandé.

