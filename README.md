# Ochitsu 🩺✨

Ochitsu est un compagnon de santé mentale intelligent et moderne, conçu pour aider les patients à suivre leur humeur et à partager de manière sécurisée leur journal quotidien avec leur professionnel de santé. Le projet se compose d'une application mobile (iOS & Android) et d'un portail web.

## 🚀 Fonctionnalités implémentées

### 1. 📷 Prise de photos & Pièces jointes
* **Mobile (Natif)** : Intégration de l'appareil photo natif du téléphone (`expo-image-picker`) pour une capture matérielle robuste et stable, et sélection dans la galerie photos.
* **Web** : Ouverture d'une caméra sur mesure avec flux vidéo webcam en direct (HTML5 `<video>`), capture d'image via canvas, et arrêt automatique des flux lors de la fermeture pour préserver l'autonomie.

### 2. 🎙️ Dictée Vocale (Speech-to-Text)
* **Web** : Intégration de l'API native `SpeechRecognition` / `webkitSpeechRecognition` pour une dictée fluide à voix haute directement dans le champ texte.
* **Mobile** : Recommandation d'utilisation du micro natif intégré aux claviers virtuels d'iOS et Android pour une compatibilité à 100 % sous l'environnement Expo Go.

### 3. 🔍 Liaison Médecin-Patient par QR Code
* **Espace Professionnel** : Génération en direct d'un QR code unique lié au code d'invitation du praticien (géré par API de rendu dynamique).
* **Espace Patient (Mobile & Web)** : Module de scan de QR code intégré. Sur mobile, il utilise `CameraView` d'Expo Camera. Sur Web, il décode le flux de la webcam en temps réel via la bibliothèque `jsQR`.
* **Liaison instantanée** : Dès que le QR Code est scanné, l'application associe automatiquement le médecin au profil du patient dans la base de données Supabase.

### 4. 🔕 Compatibilité Expo Go (SDK 54)
* **Bypass de crash** : Les imports de push-notifications (`expo-notifications`) sont chargés dynamiquement afin d'éviter les crashs de démarrage typiques d'Expo Go sur Android (depuis la suppression de l'API de push d'Expo Go par Expo au SDK 53).

---

## 🛠️ Stack Technique

* **Framework** : React Native & Expo (SDK 54), Expo Router v3
* **Web** : React Native Web
* **Style** : Tailwind CSS via NativeWind v4
* **Backend & BDD** : Supabase (PostgreSQL) avec Row Level Security (RLS) active
* **Décodage QR** : `jsQR` (Web)

---

## 💻 Démarrage rapide

### 1. Cloner le dépôt et installer les dépendances
```bash
cd frontend
npm install
```

### 2. Configurer les variables d'environnement
Créez un fichier `.env` dans le dossier `frontend` :
```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anonyme
```

### 3. Lancer l'application
* **Mode Web** :
  ```bash
  npm run web
  ```
* **Mode Mobile (Expo Go)** :
  ```bash
  npx expo start
  ```
  Scannez ensuite le QR code affiché dans la console avec l'application **Expo Go** sur votre appareil mobile.

---

## 🔒 Sécurité & Base de données
Les schémas SQL de la base de données et les configurations des politiques de sécurité (RLS) se trouvent dans le dossier [supabase/migrations](file:///c:/Users/yoann/Desktop/ynov/B3%2025-26/ydays%202/DevMobile/supabase/migrations). Pour la configuration initiale de Supabase, veuillez vous référer au guide [docs/SUPABASE_SETUP.md](file:///c:/Users/yoann/Desktop/ynov/B3%2025-26/ydays%202/DevMobile/docs/SUPABASE_SETUP.md).
