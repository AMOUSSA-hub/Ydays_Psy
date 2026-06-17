# Diagrammes de l'Application Ochitsu

Ce document présente les différents diagrammes modélisant l'application Ochitsu, entièrement en français.

## 1. Diagramme Conceptuel (Modèle de Données)
Ce diagramme illustre les entités métier et leurs relations.

```mermaid
classDiagram
    class Utilisateur {
        +UUID id
        +Texte email
        +Texte nom
    }
    class NoteJournal {
        +UUID id
        +Texte titre
        +Texte contenu
        +Nombre score_humeur
        +Booléen est_partagé
        +DateHeure créé_le
    }
    class SuiviHumeur {
        +Date date_enregistrement
        +Nombre score_humeur
        +Texte note
    }
    class Rappel {
        +UUID id
        +Texte titre
        +Texte corps
        +DateHeure planifié_le
        +Texte récurrence
        +Booléen activé
    }
    class Questionnaire {
        +UUID id
        +Texte identifiant
        +Texte titre
        +JSON contenu
    }
    class ReponseQuestionnaire {
        +UUID id
        +JSON reponses
        +Nombre score
        +Texte résumé
        +DateHeure créé_le
    }
    class Activite {
        +UUID id
        +Texte titre
        +Texte description
    }
    class SessionActivite {
        +DateHeure terminé_le
    }

    Utilisateur "1" -- "*" NoteJournal : écrit
    Utilisateur "1" -- "*" SuiviHumeur : enregistre
    Utilisateur "1" -- "*" Rappel : planifie
    Utilisateur "1" -- "*" ReponseQuestionnaire : répond
    Utilisateur "1" -- "*" SessionActivite : complète
    Questionnaire "1" -- "*" ReponseQuestionnaire : appartient à
    Activite "1" -- "*" SessionActivite : instancie
```

## 2. Diagramme Logique (Architecture Applicative)
Ce diagramme détaille l'organisation fonctionnelle en couches de l'application.

```mermaid
graph TD
    subgraph "Couche Présentation (UI)"
        Vues[Vues / Écrans .tsx]
        Composants[Composants UI / Thèmes]
    end

    subgraph "Couche Logique / État"
        Contextes[Contextes d'Auth / Thème]
        Hooks[Hooks Perso: useAuth, etc.]
        Validation[Validation des entrées]
    end

    subgraph "Couche Accès aux Données (DAL)"
        Depots[Dépôts / Repositories.ts]
        StockageLocalStore[local-store.ts]
        ClientSupabase[supabase.ts]
    end

    subgraph "Services Externes / Persistance"
        Supabase[(Supabase Cloud)]
        AsyncStorage[(AsyncStorage Local)]
        Notifications[Expo Notifications]
    end

    Vues --> Hooks
    Hooks --> Contextes
    Vues --> Depots
    Depots --> StockageLocalStore
    Depots --> ClientSupabase
    StockageLocalStore --> AsyncStorage
    ClientSupabase --> Supabase
    Contextes --> ClientSupabase
```

## 3. Diagramme Physique (Architecture Technique)
Ce diagramme illustre les composants technologiques et l'infrastructure.

```mermaid
graph LR
    subgraph "Côté Client (Frontend)"
        App[Application Expo / React Native]
        StockageLocal[(Stockage AsyncStorage)]
        Notifs[Notifications Push]
    end

    subgraph "Côté Serveur (Supabase)"
        AuthS[Authentification]
        BDD[(Base de données PostgreSQL)]
        StockageS[Stockage Cloud S3]
    end

    App <-->|HTTPS / REST| AuthS
    App <-->|PostgREST| BDD
    App <-->|Compatible S3| StockageS
    App -.->|Synchro Locale| StockageLocal
```

## 4. Diagramme d'Activité (Parcours Utilisateur Type)
Exemple d'une session quotidienne typique.

```mermaid
stateDiagram-v2
    [*] --> TableauDeBord : Ouverture de l'app
    TableauDeBord --> VerifierCalendrier : Voir le calendrier
    VerifierCalendrier --> EnregistrerHumeur : Note du jour
    EnregistrerHumeur --> TableauDeBord
    
    TableauDeBord --> EcrireJournal : "Besoin d'écrire"
    EcrireJournal --> SaisieNote : Titre & Texte
    SaisieNote --> ChoisirEmoji : Sélection humeur
    ChoisirEmoji --> OptionPartage : Partager avec médecin ?
    OptionPartage --> Sauvegarde : Enregistrement
    Sauvegarde --> TableauDeBord

    TableauDeBord --> FaireActivite : "Besoin de calme"
    FaireActivite --> ChoisirExercice : Sélection
    ChoisirExercice --> RealiserActivite : Pratique
    RealiserActivite --> TableauDeBord
```
