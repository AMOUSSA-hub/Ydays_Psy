# Cahier des spécifications — Ochitsu

**Application mobile et web d'accompagnement en santé mentale**

| | |
|---|---|
| **Projet** | Ochitsu (落ち着く — « se calmer / s'apaiser ») |
| **Type de document** | Spécifications fonctionnelles et techniques |
| **Contexte** | Projet Ydays — Ynov |
| **Version** | 1.0 |
| **Date** | Juin 2026 |
| **Statut** | Validé |
| **Auteur** | Équipe projet Ochitsu |

---

## Table des matières

1. [Introduction](#1-introduction)
2. [Présentation générale du projet](#2-présentation-générale-du-projet)
3. [Acteurs et parties prenantes](#3-acteurs-et-parties-prenantes)
4. [Glossaire](#4-glossaire)
5. [Spécifications fonctionnelles](#5-spécifications-fonctionnelles)
6. [Parcours utilisateurs (cas d'usage)](#6-parcours-utilisateurs-cas-dusage)
7. [Règles de gestion](#7-règles-de-gestion)
8. [Spécifications techniques](#8-spécifications-techniques)
9. [Modèle de données](#9-modèle-de-données)
10. [Accès aux données (Supabase + RLS)](#10-accès-aux-données-supabase--rls)
11. [Sécurité et confidentialité (RGPD)](#11-sécurité-et-confidentialité-rgpd)
12. [Spécifications non fonctionnelles](#12-spécifications-non-fonctionnelles)
13. [Interface et expérience utilisateur](#13-interface-et-expérience-utilisateur)
14. [Environnements et déploiement](#14-environnements-et-déploiement)
15. [Plan de tests et recette](#15-plan-de-tests-et-recette)
16. [Gestion de projet](#16-gestion-de-projet)
17. [Analyse des risques](#17-analyse-des-risques)
18. [Évolutions futures](#18-évolutions-futures)
19. [Annexes](#19-annexes)

---

## 1. Introduction

### 1.1 Objet du document

Ce document constitue le cahier des spécifications de l'application **Ochitsu**. Il décrit de manière exhaustive les besoins fonctionnels, les exigences techniques, les contraintes et les règles de gestion qui encadrent la conception et la réalisation du produit. Il sert de référence contractuelle entre l'équipe de développement et les parties prenantes, et de support pour la phase de recette.

### 1.2 Portée

Le document couvre :

- la définition du périmètre fonctionnel (ce que fait l'application et ce qu'elle ne fait pas) ;
- la description détaillée des fonctionnalités, écran par écran ;
- l'architecture technique (frontend, backend, base de données) ;
- le modèle de données et l'accès aux données (Supabase + RLS) ;
- les exigences de sécurité et de conformité au RGPD, particulièrement sensibles dans le domaine de la santé mentale ;
- les exigences non fonctionnelles (performance, disponibilité, accessibilité, compatibilité) ;
- le plan de tests et la stratégie de déploiement.

### 1.3 Documents de référence

| Référence | Description |
|---|---|
| `supabase/migrations/0002_ochitsu_rls.sql` | Schéma PostgreSQL + politiques RLS |
| `docs/SUPABASE_SETUP.md` | Procédure de configuration Supabase |
| `db-schema.png` | Diagramme entité-association |
| `frontend/app/` | Arborescence des écrans (Expo Router) |

### 1.4 Conventions

- Les exigences fonctionnelles sont identifiées par le préfixe **EF-xx**.
- Les exigences non fonctionnelles par **ENF-xx**.
- Les règles de gestion par **RG-xx**.
- Les mots-clés « DOIT », « DEVRAIT », « PEUT » expriment respectivement une obligation, une recommandation et une option.

---

## 2. Présentation générale du projet

### 2.1 Contexte et problématique

La santé mentale est devenue un enjeu majeur de santé publique. Beaucoup de personnes en souffrance peinent à verbaliser leur état entre deux rendez-vous, oublient l'évolution de leur humeur, ou ne disposent pas d'outils simples pour instaurer des routines de bien-être. Côté praticiens (psychologues, psychiatres), le suivi repose souvent uniquement sur le déclaratif du patient au moment de la consultation, sans données objectives sur l'intervalle écoulé.

**Ochitsu** répond à ce double besoin en proposant un **outil d'accompagnement de la relation entre un patient et son professionnel de santé mentale**. Le patient documente son quotidien (humeur, journal, auto-évaluations, exercices) ; il peut, **s'il le souhaite et de façon granulaire**, partager certaines de ces données avec son praticien attitré, afin d'enrichir la matière à discussion lors des consultations.

### 2.2 Vision produit

> Offrir à chacun un espace bienveillant et confidentiel pour prendre soin de sa santé mentale au quotidien, et permettre — sur consentement explicite — un pont de confiance vers son professionnel de santé.

### 2.3 Objectifs

| Objectif | Description |
|---|---|
| **O1** | Permettre au patient un suivi quotidien de son humeur et de son ressenti |
| **O2** | Offrir un journal intime numérique avec partage optionnel |
| **O3** | Proposer des auto-évaluations validées (PHQ-9, GAD-7, sommeil) |
| **O4** | Mettre à disposition des exercices de bien-être (respiration, méditation) |
| **O5** | Faciliter l'accès aux numéros d'urgence et à des professionnels |
| **O6** | Donner au professionnel une vue synthétique des données **partagées** de ses patients |
| **O7** | Garantir la confidentialité et le contrôle des données par le patient |

### 2.4 Périmètre

**Inclus dans la version 1.0 :**

- Authentification par email / mot de passe, avec deux rôles (patient, professionnel).
- Espace patient : accueil, journal, humeur, agenda/rituels, bilans, exercices, urgences, profil.
- Espace professionnel : liste de patients, fiche patient détaillée, agenda des rendez-vous, profil avec code d'invitation.
- Liaison patient ↔ professionnel via un code d'invitation.
- Partage granulaire (par note de journal) et partage par défaut (humeur, bilans).

**Exclu de la version 1.0 (voir §18) :**

- Messagerie temps réel patient ↔ professionnel.
- Visioconsultation et prise de rendez-vous en ligne intégrée.
- Assistant conversationnel (« Ochitsu Bot ») connecté à une IA — présent en maquette uniquement.
- Annuaire dynamique géolocalisé des thérapeutes (données d'exemple en v1).
- Notifications push serveur (seules les notifications locales sont gérées côté client).

### 2.5 Proposition de valeur

- **Pour le patient** : un compagnon quotidien, simple et rassurant, qui l'aide à mieux se connaître et à garder le contrôle sur ses données.
- **Pour le professionnel** : des données objectives et contextualisées entre les séances, sans saisie supplémentaire de sa part.
- **Différenciateur** : le **partage granulaire consenti**, cœur de l'application, qui distingue Ochitsu d'un simple journal d'humeur.

---

## 3. Acteurs et parties prenantes

### 3.1 Acteurs du système

| Acteur | Rôle | Description |
|---|---|---|
| **Patient** | Utilisateur principal | Personne qui suit son bien-être mental et alimente ses données |
| **Professionnel de santé** | Utilisateur secondaire | Psychologue / psychiatre consultant les données partagées de ses patients |
| **Système (API)** | Acteur technique | Applique l'authentification, les règles de partage et la persistance |
| **Visiteur** | Acteur transitoire | Personne non authentifiée sur l'écran d'accueil |

### 3.2 Matrice acteurs / fonctionnalités

| Fonctionnalité | Visiteur | Patient | Professionnel |
|---|:---:|:---:|:---:|
| Créer un compte / se connecter | ✅ | — | — |
| Saisir son humeur quotidienne | — | ✅ | — |
| Rédiger une note de journal | — | ✅ | — |
| Réaliser un bilan / quiz | — | ✅ | — |
| Lancer un exercice de bien-être | — | ✅ | — |
| Consulter les numéros d'urgence | — | ✅ | ✅ |
| Se relier à un professionnel (code) | — | ✅ | — |
| Générer / partager un code d'invitation | — | — | ✅ |
| Consulter la liste de ses patients | — | — | ✅ |
| Voir le détail d'un patient (données partagées) | — | — | ✅ |

---

## 4. Glossaire

| Terme | Définition |
|---|---|
| **Bilan / Quiz** | Questionnaire d'auto-évaluation (PHQ-9, GAD-7, sommeil) |
| **PHQ-9** | *Patient Health Questionnaire* : échelle de dépistage de la dépression |
| **GAD-7** | *Generalized Anxiety Disorder* : échelle d'anxiété généralisée |
| **Humeur (mood)** | Score quotidien de 1 (difficile) à 5 (super) |
| **Rituel** | Routine de bien-être planifiable (zen, nuit, matin) |
| **Code d'invitation** | Code à 6 caractères généré pour un professionnel, permettant à un patient de le relier |
| **is_shared** | Indicateur de partage d'une donnée avec le professionnel relié |
| **Slug** | Identifiant lisible et stable (ex. `phq9-lite`) utilisé pour le routage |
| **JWT** | *JSON Web Token* : jeton de session émis et géré par Supabase Auth |
| **RLS** | *Row Level Security* : contrôle d'accès PostgreSQL appliqué ligne par ligne |

---

## 5. Spécifications fonctionnelles

Cette section décrit chaque module fonctionnel, écran par écran, avec les exigences associées.

### 5.1 Module Authentification

**Objectif** : permettre la création de compte et la connexion sécurisée, en distinguant patients et professionnels.

| ID | Exigence |
|---|---|
| **EF-01** | Le système DOIT proposer, sur l'écran d'accueil, le choix entre l'espace Patient et l'espace Professionnel. |
| **EF-02** | Le système DOIT permettre la création d'un compte avec email, mot de passe et nom affiché optionnel. |
| **EF-03** | Le mot de passe DOIT comporter au moins 6 caractères ; le hachage et le stockage sont assurés par Supabase Auth. |
| **EF-04** | Le système DOIT refuser une inscription si l'email est déjà utilisé. |
| **EF-05** | À l'inscription d'un professionnel, le système DOIT générer un code d'invitation unique à 6 caractères. |
| **EF-06** | Le système DOIT permettre la connexion par email / mot de passe (session persistée par Supabase Auth). |
| **EF-07** | Le système DOIT rediriger l'utilisateur vers l'espace correspondant à son rôle après connexion. |
| **EF-08** | Le système DOIT permettre la déconnexion (suppression du jeton local). |
| **EF-09** | Une session expirée ou un jeton invalide DOIT ramener l'utilisateur à l'écran d'accueil. |

**Écrans concernés** : `app/index.tsx` (accueil), `app/auth.tsx` (connexion/inscription).

### 5.2 Module Accueil patient

**Objectif** : offrir une vue d'ensemble quotidienne et un accès rapide aux fonctionnalités.

| ID | Exigence |
|---|---|
| **EF-10** | L'accueil DOIT afficher une citation inspirante. |
| **EF-11** | L'accueil DOIT présenter une bande de 7 jours avec l'humeur enregistrée. |
| **EF-12** | L'accueil DOIT proposer un accès direct au Journal, aux Quiz et aux Exercices. |
| **EF-13** | L'accueil PEUT afficher un compagnon visuel (mascotte) menant à l'espace bot. |

**Écran concerné** : `app/(tabs)/home.tsx`.

### 5.3 Module Journal intime

**Objectif** : permettre la rédaction et la gestion de notes personnelles, avec partage optionnel.

| ID | Exigence |
|---|---|
| **EF-14** | Le patient DOIT pouvoir créer une note avec un titre et un corps de texte. |
| **EF-15** | Le patient DOIT pouvoir associer une humeur (1 à 5) à une note. |
| **EF-16** | Le patient DOIT pouvoir choisir, **pour chaque note**, si elle est partagée avec son professionnel (Oui/Non). |
| **EF-17** | Par défaut, une note DOIT être **privée** (`is_shared = false`). |
| **EF-18** | Le patient DOIT pouvoir consulter, rechercher, modifier et supprimer ses notes. |
| **EF-19** | La liste DOIT être triée par date de création décroissante. |

**Écrans concernés** : `app/(tabs)/book.tsx` (liste), `app/(tabs)/journal-entry.tsx` (édition).

### 5.4 Module Humeur et agenda

**Objectif** : suivre l'humeur quotidienne et planifier des rituels.

| ID | Exigence |
|---|---|
| **EF-20** | Le patient DOIT pouvoir enregistrer son humeur du jour sur une échelle de 1 à 5 (emoji). |
| **EF-21** | Une seule humeur DOIT exister par jour (mise à jour si déjà saisie). |
| **EF-22** | Le système DOIT afficher un graphique de l'humeur sur les 7 derniers jours et une moyenne. |
| **EF-23** | À l'enregistrement, le système DOIT afficher un message d'encouragement adapté au score. |
| **EF-24** | Le patient DOIT pouvoir planifier un rituel (zen, nuit, matin) avec jour, heure et durée. |
| **EF-25** | Les rituels et rappels planifiés DOIVENT apparaître dans la liste « Mon programme ». |
| **EF-26** | Le patient DOIT pouvoir supprimer un rappel. |
| **EF-27** | L'humeur quotidienne DOIT être partagée par défaut avec le professionnel (`is_shared = true`). |

**Écran concerné** : `app/(tabs)/agenda.tsx`.

### 5.5 Module Bilans / Quiz

**Objectif** : proposer des auto-évaluations standardisées et en conserver l'historique.

| ID | Exigence |
|---|---|
| **EF-28** | Le système DOIT proposer une liste de questionnaires (PHQ-9, GAD-7, sommeil). |
| **EF-29** | Le patient DOIT pouvoir répondre question par question, avec barre de progression. |
| **EF-30** | À la fin, le système DOIT calculer un score et afficher une synthèse adaptée. |
| **EF-31** | Le système DOIT enregistrer chaque soumission (réponses, score, synthèse, date). |
| **EF-32** | Le système DOIT prévenir l'utilisateur en cas d'abandon avant la fin. |
| **EF-33** | Les bilans DOIVENT être partagés par défaut avec le professionnel. |

**Écrans concernés** : `app/(tabs)/quiz/index.tsx`, `app/(tabs)/quiz/[slug].tsx`.

### 5.6 Module Exercices de bien-être

**Objectif** : proposer des activités courtes (respiration, méditation, conseils).

| ID | Exigence |
|---|---|
| **EF-34** | Le système DOIT lister les activités disponibles (respiration 4-7-8, méditation, conseils sommeil). |
| **EF-35** | Le patient DOIT pouvoir lancer une activité et la marquer comme réalisée. |
| **EF-36** | Le système DOIT comptabiliser le nombre de séances réalisées. |

**Écrans concernés** : `app/(tabs)/activities/index.tsx`, `app/(tabs)/activities/[slug].tsx`.

### 5.7 Module Urgences et orientation

**Objectif** : donner un accès immédiat aux secours et à des professionnels.

| ID | Exigence |
|---|---|
| **EF-37** | Le système DOIT afficher en évidence les numéros d'urgence vitale (SAMU 15, 3114, 112). |
| **EF-38** | Le système DOIT permettre d'appeler un numéro en un geste (`tel:`). |
| **EF-39** | Le système DOIT lister des contacts d'aide (Fil Santé Jeunes, ligne TCA, etc.). |
| **EF-40** | Le système PEUT présenter un annuaire de thérapeutes trié par popularité ou distance. |
| **EF-41** | Le patient DOIT pouvoir programmer un rappel d'appel depuis une fiche. |

**Écran concerné** : `app/(tabs)/phone.tsx`.

### 5.8 Module Profil patient et liaison

**Objectif** : gérer son compte et la liaison à son professionnel.

| ID | Exigence |
|---|---|
| **EF-42** | Le profil DOIT afficher l'identité du patient (nom, email). |
| **EF-43** | Le patient DOIT pouvoir saisir un code d'invitation pour se relier à un professionnel. |
| **EF-44** | Le système DOIT refuser un code invalide avec un message explicite. |
| **EF-45** | Une fois relié, le système DOIT afficher le professionnel et indiquer que le partage est actif. |
| **EF-46** | Le patient DOIT pouvoir **révoquer** le partage à tout moment. |

**Écran concerné** : `app/(tabs)/profile.tsx`.

### 5.9 Module Espace professionnel

**Objectif** : permettre au praticien de suivre ses patients.

| ID | Exigence |
|---|---|
| **EF-47** | Le professionnel DOIT voir la liste de ses patients reliés. |
| **EF-48** | Chaque patient DOIT être résumé : dernière humeur, moyenne 7 jours, tendance, nb de notes/bilans. |
| **EF-49** | Le système DOIT signaler les patients « à surveiller » (humeur basse ou en baisse). |
| **EF-50** | Le professionnel DOIT pouvoir consulter le détail d'un patient : graphique d'humeur, bilans, **notes partagées uniquement**. |
| **EF-51** | Le professionnel ne DOIT JAMAIS voir une note privée d'un patient. |
| **EF-52** | Le professionnel DOIT voir un agenda des rendez-vous à venir issus des rappels de ses patients. |
| **EF-53** | Le profil professionnel DOIT afficher son code d'invitation à communiquer. |

**Écrans concernés** : `app/pro/patients.tsx`, `app/pro/patient/[id].tsx`, `app/pro/agenda.tsx`, `app/pro/profile.tsx`.

### 5.10 Module Réglages

| ID | Exigence |
|---|---|
| **EF-54** | L'utilisateur DOIT pouvoir choisir le thème (automatique, jour, nuit). |
| **EF-55** | L'utilisateur DOIT pouvoir accéder à la politique de confidentialité. |
| **EF-56** | L'utilisateur DOIT pouvoir se déconnecter. |

**Écrans concernés** : `app/(tabs)/settings.tsx`, `app/(tabs)/privacy.tsx`.

---

## 6. Parcours utilisateurs (cas d'usage)

### 6.1 UC-01 — Inscription et première humeur (patient)

**Acteur** : Patient · **Préconditions** : application installée, projet Supabase configuré.

1. Le visiteur ouvre l'application et choisit « Patient ».
2. Il bascule sur l'onglet « Inscription », saisit email + mot de passe.
3. Le système crée le compte, renvoie un jeton et ouvre l'accueil patient.
4. Le patient ouvre l'Agenda et sélectionne un emoji d'humeur.
5. Le système enregistre l'humeur et affiche un message d'encouragement.

**Postcondition** : une ligne `mood_logs` existe pour le jour courant.

### 6.2 UC-02 — Partage d'une note avec le médecin

**Acteur** : Patient · **Préconditions** : compte patient, professionnel relié.

1. Le patient ouvre le Journal et crée une note.
2. Il rédige son texte, associe une humeur, et positionne « Partager = Oui ».
3. Le système enregistre la note avec `is_shared = true`.
4. La note devient visible dans la fiche patient côté professionnel.

**Postcondition** : la note partagée apparaît côté professionnel ; les notes privées restent invisibles.

### 6.3 UC-03 — Liaison patient ↔ professionnel

**Acteur** : Patient · **Préconditions** : le professionnel a communiqué son code.

1. Le professionnel consulte son code d'invitation dans son profil.
2. Il transmet ce code au patient (hors application).
3. Le patient saisit le code dans son profil et valide.
4. Le système crée le lien et confirme le partage actif.

**Postcondition** : une ligne `patient_professional_links` existe.

### 6.4 UC-04 — Suivi d'un patient (professionnel)

**Acteur** : Professionnel · **Préconditions** : au moins un patient relié.

1. Le professionnel ouvre « Mes Patients ».
2. Il identifie un patient « à surveiller ».
3. Il ouvre la fiche : graphique d'humeur, bilans, notes partagées.
4. Il prépare son prochain rendez-vous à partir de ces éléments.

**Postcondition** : aucune écriture ; consultation seule.

### 6.5 UC-05 — Situation d'urgence

**Acteur** : Patient · **Préconditions** : aucune.

1. Le patient ouvre l'écran Urgences.
2. Il appuie sur « 3114 » ou « 15 ».
3. Le système déclenche l'appel téléphonique.

**Postcondition** : appel lancé via le système d'exploitation.

---

## 7. Règles de gestion

| ID | Règle |
|---|---|
| **RG-01** | Un utilisateur possède exactement un rôle : patient **ou** professionnel. |
| **RG-02** | Les mots de passe sont gérés par Supabase Auth (hachés, jamais stockés ni renvoyés en clair par l'app). |
| **RG-03** | Un email est unique dans le système. |
| **RG-04** | Un professionnel possède un code d'invitation unique à 6 caractères (alphabet sans caractères ambigus). |
| **RG-05** | Un patient peut être relié à un professionnel via ce code ; le couple (patient, professionnel) est unique. |
| **RG-06** | L'humeur est partagée par défaut ; une note de journal est privée par défaut ; un bilan est partagé par défaut. |
| **RG-07** | Un professionnel ne peut lire que les données `is_shared = true` des patients qui l'ont relié. |
| **RG-08** | Il existe au plus une humeur par patient et par jour. |
| **RG-09** | Un score d'humeur est un entier compris entre 1 et 5. |
| **RG-10** | La suppression d'un compte entraîne la suppression en cascade de toutes ses données. |
| **RG-11** | Un patient « à surveiller » est défini par : dernière humeur ≤ 2, OU moyenne 7 jours ≤ 2,2, OU tendance en baisse. |
| **RG-12** | La tendance compare la moyenne des 3 dernières humeurs à celle des 3 précédentes (seuil 0,3). |

---

## 8. Spécifications techniques

### 8.1 Vue d'ensemble de l'architecture

L'application s'appuie sur **Supabase** (BaaS) : le client communique directement
avec Supabase Auth et la base PostgreSQL, le contrôle d'accès étant assuré par les
politiques **Row Level Security (RLS)**.

```
┌─────────────────────────────┐      HTTPS (supabase-js)      ┌──────────────────────────┐
│   Application cliente        │  ─────────────────────────▶  │   Supabase                │
│   React Native + Expo        │   JWT (session persistée)    │   • Auth (email/password) │
│   (iOS / Android / Web)      │  ◀─────────────────────────  │   • PostgreSQL + RLS       │
└─────────────────────────────┘                              │   • 10 tables relationnelles│
                                                              └──────────────────────────┘
```

### 8.2 Pile technologique

| Couche | Technologie | Justification |
|---|---|---|
| **Frontend** | React Native + Expo Router | Une seule base de code pour iOS, Android et Web |
| **Styling** | NativeWind (Tailwind CSS) | Cohérence visuelle, productivité |
| **Langage front** | TypeScript | Typage statique, fiabilité |
| **Backend (BaaS)** | Supabase | Auth + PostgreSQL + RLS gérés, distants |
| **Authentification** | Supabase Auth (email/password) | Session persistée, jeton géré par le SDK |
| **Base de données** | PostgreSQL (Supabase) | Relationnel, contraintes d'intégrité |
| **Sécurité d'accès** | Row Level Security (RLS) | Contrôle d'accès par politique SQL, par ligne |
| **SDK / accès BD** | `@supabase/supabase-js` | Requêtes typées, temps réel possible |
| **Stockage local** | AsyncStorage | Persistance de la session et des préférences |

### 8.3 Choix de la base de données

Le choix s'est porté sur une base **relationnelle (PostgreSQL via Supabase)** plutôt que NoSQL :

- **Données fortement structurées et reliées** : un patient possède des humeurs, des notes, des bilans ; il est relié à un professionnel. Ces relations s'expriment naturellement par des clés étrangères.
- **Intégrité référentielle** : les contraintes `FOREIGN KEY`, `CHECK` et `UNIQUE` garantissent la cohérence (un score entre 1 et 5, une humeur unique par jour, etc.).
- **Confidentialité par conception** : la **RLS** filtre les lignes accessibles directement en base — un professionnel ne lit que les lignes `is_shared` des patients qui l'ont relié.
- **Transactions ACID** : essentielles pour des données de santé.

Une base documentaire (Firebase, MongoDB) aurait été inadaptée : duplication de données, absence de contraintes, contrôle d'accès croisé complexe.

### 8.4 Organisation côté Supabase

```
supabase/
  migrations/
    0002_ochitsu_rls.sql   schéma + fonctions + trigger + politiques RLS + seed
```

Éléments clés du script :
- **Tables** : 10 tables dans le schéma `public`, `user_id` référençant `auth.users`.
- **Fonctions** : `gen_invite_code()`, `set_updated_at()`,
  `is_linked_professional(patient)` (`security definer`),
  `handle_new_user()` (trigger sur `auth.users` qui crée le profil et le code d'invitation).
- **Politiques RLS** : une par table (lecture propriétaire + partage pro, écriture propriétaire).

### 8.5 Organisation du code frontend

```
frontend/app/
  index.tsx                accueil (choix d'espace)
  auth.tsx                 connexion / inscription
  (tabs)/                  espace patient (barre de navigation)
    home, book, character, agenda, phone, profile
    journal-entry, quiz/, activities/, settings, privacy
  pro/                     espace professionnel
    patients, patient/[id], agenda, profile
frontend/lib/
  supabase.ts              client Supabase (session persistée via AsyncStorage)
  repositories.ts          accès aux données patient (Supabase + RLS)
  pro-data.ts              accès aux données professionnel (Supabase + RLS)
frontend/contexts/
  auth-context.tsx         état d'authentification global (Supabase Auth)
```

---

## 9. Modèle de données

### 9.1 Diagramme

Voir le fichier `db-schema.png` à la racine du projet.

### 9.2 Tables

Le schéma comprend **10 tables** dans `public` (voir `supabase/migrations/0002_ochitsu_rls.sql`).
L'authentification s'appuie sur la table managée **`auth.users`** de Supabase ; les
attributs applicatifs (rôle, nom, code) sont portés par la table `profiles` ci-dessous.

**`profiles`** — profil applicatif (1:1 avec `auth.users`).

| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK, FK → `auth.users`, ON DELETE CASCADE |
| email | text | (copié pour affichage côté pro) |
| role | text | CHECK (patient \| professional), défaut patient |
| display_name | text | |
| invite_code | text | UNIQUE (professionnels) |
| created_at / updated_at | timestamptz | défaut now() |

> Les mots de passe ne figurent pas ici : ils sont gérés et hachés par Supabase Auth (`auth.users`).

**`patient_professional_links`** — liaison de partage.

| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| patient_id | uuid | FK → auth.users, ON DELETE CASCADE |
| professional_id | uuid | FK → auth.users, ON DELETE CASCADE |
| created_at | timestamptz | |
| | | UNIQUE (patient_id, professional_id) |

**`journal_entries`** — notes (partage par note).

| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| title / body | text | NOT NULL, défaut '' |
| mood_score | int | CHECK 1..5 |
| is_shared | boolean | défaut **false** |
| created_at / updated_at | timestamptz | |

**`mood_logs`** — humeur quotidienne.

| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| logged_date | date | |
| mood_score | int | NOT NULL, CHECK 1..5 |
| note | text | |
| is_shared | boolean | défaut **true** |
| | | UNIQUE (user_id, logged_date) |

**`questionnaires`** et **`questionnaire_submissions`** — référentiel des bilans et soumissions (avec `is_shared` défaut true).

**`activities`** et **`activity_sessions`** — référentiel des exercices et séances réalisées.

**`reminders`** — rappels / agenda (titre, date planifiée, récurrence, notification locale).

**`help_contacts`** — numéros d'urgence et d'aide (UNIQUE sur category + title).

### 9.3 Intégrité et index

- Toutes les clés étrangères vers `auth.users` sont en `ON DELETE CASCADE`.
- Index secondaires sur les colonnes de filtrage (`user_id`, `professional_id`, `patient_id`).
- Triggers `updated_at` sur `profiles` et `journal_entries`.
- **Politiques RLS** activées sur les 10 tables (cœur du contrôle d'accès).

---

## 10. Accès aux données (Supabase + RLS)

Il n'y a pas d'API REST custom : le client utilise le SDK `@supabase/supabase-js`
pour interroger directement Auth et PostgreSQL. **Chaque requête est filtrée par
les politiques RLS** côté base — la sécurité ne dépend pas du client.

### 10.1 Authentification (Supabase Auth)

| Opération | Appel SDK |
|---|---|
| Inscription | `supabase.auth.signUp({ email, password, options:{ data:{ role, display_name } } })` |
| Connexion | `supabase.auth.signInWithPassword({ email, password })` |
| Session | `supabase.auth.getSession()` + `onAuthStateChange` |
| Déconnexion | `supabase.auth.signOut()` |

À l'inscription, un **trigger** (`handle_new_user`) crée automatiquement le profil
(rôle, nom, et code d'invitation si professionnel) à partir des métadonnées.

### 10.2 Données patient (tables, via RLS)

| Table | Opérations | Accès |
|---|---|---|
| `journal_entries` | select / insert / update / delete | propriétaire (lecture pro si `is_shared`) |
| `mood_logs` | select / upsert | propriétaire (lecture pro, partagé par défaut) |
| `questionnaires` | select | tout utilisateur connecté |
| `questionnaire_submissions` | select / insert | propriétaire (lecture pro, partagé par défaut) |
| `activities` / `activity_sessions` | select / insert | référentiel / propriétaire |
| `reminders` | select / insert / update / delete | propriétaire (lecture pro) |
| `help_contacts` | select | tout utilisateur connecté |

### 10.3 Liaison & espace professionnel

| Besoin | Mécanisme |
|---|---|
| Trouver un pro par code | `select … from profiles where invite_code = ? and role='professional'` |
| Relier / révoquer | insert / delete dans `patient_professional_links` |
| Patients du pro | `select` filtré par RLS (pro voit les liens et les données partagées) |
| Code d'invitation | `select invite_code from profiles where id = auth.uid()` |

### 10.4 Exemple (connexion + lecture des humeurs)

```ts
await supabase.auth.signInWithPassword({ email, password });
// La RLS ne renverra que les lignes autorisées pour l'utilisateur courant :
const { data } = await supabase
  .from('mood_logs')
  .select('*')
  .eq('user_id', userId)
  .order('logged_date', { ascending: false });
```

---

## 11. Sécurité et confidentialité (RGPD)

Les données traitées relèvent de la **santé mentale** : elles constituent des **données sensibles** au sens du RGPD (art. 9). Les exigences suivantes s'appliquent.

| ID | Exigence |
|---|---|
| **ENF-S01** | Les mots de passe DOIVENT être gérés par Supabase Auth (hachage, jamais exposés). |
| **ENF-S02** | Les échanges DOIVENT se faire en HTTPS en production. |
| **ENF-S03** | L'accès aux données d'un patient DOIT être restreint à lui-même et aux professionnels qu'il a explicitement reliés. |
| **ENF-S04** | Le partage DOIT reposer sur le **consentement explicite** du patient (liaison + `is_shared`). |
| **ENF-S05** | Le patient DOIT pouvoir **révoquer** le partage à tout moment (droit d'opposition). |
| **ENF-S06** | Le système DOIT permettre la suppression d'un compte et de toutes ses données (droit à l'effacement, via cascade). |
| **ENF-S07** | L'accès aux données DOIT être contrôlé par des politiques **RLS** (filtrage en base, par ligne). |
| **ENF-S08** | Les sessions DOIVENT reposer sur des jetons gérés par Supabase Auth (rotation, expiration). |
| **ENF-S09** | La clé de service Supabase ne DOIT jamais être embarquée dans le client (seule la clé `anon` l'est). |
| **ENF-S10** | Une politique de confidentialité DOIT être accessible dans l'application. |

**Principes appliqués** : minimisation des données, contrôle par l'utilisateur, finalité explicite (accompagnement thérapeutique), sécurité par conception (le filtrage de partage est appliqué **en base via la RLS**, jamais uniquement côté client).

**Recommandation production** : hébergement de santé certifié **HDS** (Hébergeur de Données de Santé) pour un déploiement réel en France.

---

## 12. Spécifications non fonctionnelles

| ID | Catégorie | Exigence |
|---|---|---|
| **ENF-01** | Performance | Une requête API courante DEVRAIT répondre en moins de 300 ms (hors latence réseau). |
| **ENF-02** | Performance | Les écrans DOIVENT charger leurs données de façon asynchrone avec indicateur de chargement. |
| **ENF-03** | Disponibilité | L'API DEVRAIT viser une disponibilité de 99 % en production. |
| **ENF-04** | Compatibilité | L'application DOIT fonctionner sur iOS, Android et navigateurs web modernes. |
| **ENF-05** | Responsive | L'interface DOIT s'adapter mobile / tablette / desktop (barre latérale sur grand écran). |
| **ENF-06** | Accessibilité | Les contrastes et tailles de texte DEVRAIENT respecter les bonnes pratiques WCAG AA. |
| **ENF-07** | Internationalisation | L'interface est en français ; l'architecture PERMET une future traduction. |
| **ENF-08** | Maintenabilité | Le code DOIT être typé (TypeScript) et passer `tsc` et `eslint` sans erreur. |
| **ENF-09** | Portabilité | Le backend (Supabase) est provisionné via un unique script SQL de migration. |
| **ENF-10** | Robustesse | Les erreurs (réseau / RLS) DOIVENT être interceptées et affichées clairement à l'utilisateur. |

---

## 13. Interface et expérience utilisateur

### 13.1 Charte graphique

| Élément | Valeur |
|---|---|
| Couleur principale (fond) | Lavande `#9896D4` (jour) / `#6B6588` (nuit) |
| Cartes | Gris très clair `#F2F2F7` |
| Accents | Noir pour les actions principales, rouge `#DC2626` pour l'urgence |
| Formes | Coins très arrondis (rounded-[40px]), ombres douces |
| Typographie | Sans-serif, titres en gras (font-black), majuscules pour les libellés |

### 13.2 Navigation

- **Mobile** : barre d'onglets flottante en bas (dock).
- **Desktop / tablette** : barre latérale verticale à gauche.
- **Espace patient** : Accueil, Journal, Compagnon, Agenda, Urgences, Profil.
- **Espace professionnel** : Patients, Rendez-vous, Profil.

### 13.3 Principes UX

- Bienveillance : messages d'encouragement, ton rassurant.
- Sobriété : un objectif par écran, accès rapide aux actions clés.
- Contrôle : le partage est toujours explicite et réversible.

---

## 14. Environnements et déploiement

### 14.1 Environnements

| Environnement | Usage |
|---|---|
| **Développement** | Projet Supabase de dev + application Expo en local |
| **Recette** | Validation fonctionnelle avant livraison |
| **Production** | Hébergement sécurisé (HDS recommandé) |

### 14.2 Mise en place

```bash
# 1. Backend Supabase : créer un projet, puis exécuter dans le SQL Editor
#    le script supabase/migrations/0002_ochitsu_rls.sql
#    (désactiver « Confirm email » dans Auth > Providers > Email)

# 2. Frontend
cd frontend
cp .env.example .env        # renseigner EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY
npm install && npm start    # "w" pour le web
```

La procédure détaillée figure dans `docs/SUPABASE_SETUP.md`.

### 14.3 Variables d'environnement

| Variable | Côté | Description |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | frontend | URL du projet Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | frontend | Clé publique `anon` |

---

## 15. Plan de tests et recette

### 15.1 Stratégie

Les tests couvrent les niveaux : unitaire (logique), intégration (API + base), fonctionnel (parcours), et sécurité (contrôle d'accès).

### 15.2 Scénarios de recette

| ID | Scénario | Résultat attendu |
|---|---|---|
| **T-01** | Inscription patient | Compte créé, jeton renvoyé, accueil affiché |
| **T-02** | Inscription professionnel | Code d'invitation généré |
| **T-03** | Connexion avec mauvais mot de passe | Erreur 401, message explicite |
| **T-04** | Email déjà utilisé | Erreur 409 |
| **T-05** | Enregistrement d'humeur | Une seule humeur par jour, mise à jour sinon |
| **T-06** | Note privée vs partagée | La note privée n'apparaît pas côté professionnel |
| **T-07** | Liaison par code valide | Lien créé, partage actif |
| **T-08** | Liaison par code invalide | Erreur 404 |
| **T-09** | Vue professionnelle | Patient visible avec ses données partagées |
| **T-10** | Sécurité — pro non relié | Liste vide et accès direct refusé (403) |
| **T-11** | Révocation du partage | Le professionnel ne voit plus le patient |
| **T-12** | Soumission de bilan | Score calculé et historisé |

### 15.3 Tests de sécurité (extraits)

- Accès à une route protégée sans jeton → 401.
- Accès professionnel par un patient → 403.
- Lecture du détail d'un patient non relié → 403.
- Tentative d'injection SQL via les champs texte → neutralisée (requêtes paramétrées).

### 15.4 Critères d'acceptation

La version est acceptée si l'ensemble des scénarios T-01 à T-12 passent, si `tsc` et `eslint` ne remontent aucune erreur, et si les exigences de sécurité ENF-S01 à ENF-S10 sont satisfaites.

---

## 16. Gestion de projet

### 16.1 Découpage en lots

| Lot | Contenu |
|---|---|
| **L1** | Authentification et rôles |
| **L2** | Espace patient (humeur, journal, bilans, exercices) |
| **L3** | Urgences et orientation |
| **L4** | Liaison patient ↔ professionnel |
| **L5** | Espace professionnel (suivi, fiche, agenda) |
| **L6** | Sécurité, RGPD, recette |

### 16.2 Planning indicatif

| Phase | Durée estimée |
|---|---|
| Cadrage et spécifications | 1 semaine |
| Conception (maquettes, modèle de données) | 1 semaine |
| Développement backend | 2 semaines |
| Développement frontend | 3 semaines |
| Intégration et tests | 1 semaine |
| Recette et corrections | 1 semaine |

### 16.3 Organisation

- Suivi par lots fonctionnels, livraisons incrémentales.
- Versionnement Git (branches `main` / `preProd`).
- Revue de code et vérifications automatiques (`tsc`, `eslint`) avant fusion.

---

## 17. Analyse des risques

| ID | Risque | Impact | Probabilité | Mitigation |
|---|---|---|:---:|---|
| **R-01** | Fuite de données de santé | Critique | Faible | Supabase Auth, HTTPS, **RLS**, HDS en production |
| **R-02** | Mauvais cloisonnement patient/pro | Élevé | Faible | Filtrage `is_shared` + vérification du lien côté API, tests de sécurité |
| **R-03** | Indisponibilité du backend | Élevé | Moyen | Messages d'erreur clairs côté client, supervision |
| **R-04** | Usage détourné en cas d'urgence vitale | Critique | Faible | Mise en avant des numéros d'urgence, avertissements |
| **R-05** | Mauvaise configuration RLS exposant des données | Élevé | Faible | Politiques testées (scénario pro non relié), revue du script SQL |
| **R-06** | Incompatibilité de version Node (outils front) | Moyen | Moyen | Exigence Node ≥ 20 documentée |

---

## 18. Évolutions futures

| Priorité | Évolution |
|---|---|
| 🔴 | Assistant conversationnel « Ochitsu Bot » connecté à un modèle de langage |
| 🟠 | Messagerie sécurisée patient ↔ professionnel |
| 🟠 | Prise de rendez-vous et visioconsultation |
| 🟠 | Annuaire réel de thérapeutes (table dédiée, géolocalisation) |
| 🟡 | Notifications push serveur (rappels, alertes « patient à surveiller ») |
| 🟡 | Export PDF du suivi pour le professionnel |
| 🟢 | Internationalisation (multi-langues) |
| 🟢 | Gamification des routines de bien-être |

---

## 19. Annexes

### 19.1 Liste des écrans

**Espace patient** : accueil, journal (liste + édition), compagnon, agenda, urgences, profil, quiz (liste + détail), exercices (liste + détail), réglages, confidentialité.

**Espace professionnel** : patients, fiche patient, rendez-vous, profil.

**Communs** : accueil (choix d'espace), connexion / inscription.

### 19.2 Questionnaires de référence

| Slug | Titre | Échelle |
|---|---|---|
| `phq9-lite` | Bilan rapide (PHQ-9 simplifié) | Dépression |
| `gad7-lite` | Anxiété (GAD-7 simplifié) | Anxiété |
| `sleep-lite` | Qualité du Sommeil | Sommeil |

### 19.3 Numéros d'urgence intégrés

| Numéro | Service |
|---|---|
| 15 | SAMU |
| 3114 | Prévention du suicide |
| 112 | Urgence européenne |
| 0800 235 236 | Fil Santé Jeunes |

### 19.4 Avertissement

Ochitsu est un outil d'accompagnement et **ne remplace en aucun cas un avis ou un suivi médical**. En cas de danger immédiat, l'utilisateur est invité à contacter les services d'urgence.

---

*Fin du document — Cahier des spécifications Ochitsu v1.0*
