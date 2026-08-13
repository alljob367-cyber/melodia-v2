# 🎵 MELODIA — Identifiants & Configuration

> Document de référence pour les accès et la configuration de la plateforme MELODIA

---

## 🔐 Comptes Utilisateurs

### Administrateur

| Champ | Valeur |
|-------|--------|
| **Email** | `admin@melodia.ai` |
| **Mot de passe** | `admin123` |
| **Rôle** | `admin` |
| **Plan** | Label / Studio (illimité) |
| **Crédits** | 500 |
| **Chansons restantes** | 999 |
| **Pochettes restantes** | 999 |
| **Vidéos restantes** | 30 |

### Utilisateur Démo

| Champ | Valeur |
|-------|--------|
| **Email** | `jean@example.com` |
| **Mot de passe** | `demo123` |
| **Rôle** | `user` |
| **Plan** | Artiste Actif |
| **Crédits** | 100 |
| **Chansons restantes** | 15 |
| **Pochettes restantes** | 15 |
| **Vidéos restantes** | 0 |

### Utilisateur Existant (inscrit via l'app)

| Champ | Valeur |
|-------|--------|
| **Email** | `alljob367@gmail.com` |
| **Nom** | ALLJOB BATACONNECT IA |
| **Rôle** | `user` |
| **Plan** | basic |
| **Mot de passe** | *(défini par l'utilisateur à l'inscription)* |

---

## 🗄️ Base de Données — Neon PostgreSQL

| Champ | Valeur |
|-------|--------|
| **Hôte** | `ep-dawn-bread-ay3hjwsa-pooler.c-5.us-east-2.aws.neon.tech` |
| **Base** | `neondb` |
| **Utilisateur** | `neondb_owner` |
| **Mot de passe** | `*(voir .env)*` |
| **Région** | AWS us-east-2 (Ohio) |
| **SSL** | require |
| **DATABASE_URL** | `postgresql://neondb_owner:*(voir .env)*@ep-dawn-bread-ay3hjwsa-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require` |

---

## 🔑 Clés API & Secrets

| Service | Clé / Valeur |
|---------|-------------|
| **NextAuth Secret** | `melodia-secret-dev-key-2026` |
| **NextAuth URL** | `http://localhost:3000` |
| **OpenRouter API Key** | `*(voir .env — non commité pour sécurité)*` |

---

## 💰 Plans Tarifaires (FCFA)

| Plan | Slug | Prix | Crédits | Chansons | Pochettes | Vidéos |
|------|------|------|---------|----------|-----------|--------|
| Découverte | `decouverte` | 2 000 FCFA | 20 | 3 | 3 | 0 |
| Production Musicale | `production` | 5 000 FCFA | 50 | 8 | 8 | 0 |
| Artiste Actif ⭐ | `artiste` | 10 000 FCFA | 100 | 15 | 15 | 0 |
| Vidéo | `video` | 15 000 FCFA | 150 | 20 | 20 | 3 |
| Artiste Professionnel | `professionnel` | 25 000 FCFA | 250 | 50 | 50 | 10 |
| Label / Studio | `label` | 50 000 FCFA | 500 | 999 | 999 | 30 |

---

## 🛠️ URLs de l'Application

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil |
| `/login` | Connexion |
| `/signup` | Inscription |
| `/dashboard` | Tableau de bord |
| `/create` | Création de musique |
| `/creations` | Mes créations |
| `/song` | Lecteur de chanson |
| `/subscription` | Abonnements / Plans |
| `/memory` | Mémoire / Historique |
| `/admin` | Panel Administrateur |

---

## 📋 Tables Principales (Prisma / PostgreSQL)

| Table | Description |
|-------|-------------|
| `User` | Comptes utilisateurs (email, mot de passe hashé, rôle, plan) |
| `Account` | Comptes OAuth liés |
| `Session` | Sessions NextAuth |
| `VerificationToken` | Tokens de vérification email |
| `UserCredits` | Solde de crédits et quotas par utilisateur |
| `CreditPack` | Packs tarifaires disponibles |
| `CreditTransaction` | Historique des transactions de crédits |
| `Song` | Chansons générées par l'IA |
| `AnalyticsEvent` | Événements analytiques |
| `AuditLog` | Journal d'audit |
| `GiftPage` | Pages cadeaux |

---

## ⚙️ Stack Technique

- **Framework** : Next.js (App Router)
- **ORM** : Prisma
- **DB** : Neon PostgreSQL (serverless)
- **Auth** : NextAuth.js (Credentials Provider, JWT strategy)
- **Hash** : bcryptjs (10 salt rounds)
- **UI** : Tailwind CSS + shadcn/ui
- **IA** : OpenRouter API (modèles de génération musicale)

---

*Document généré le 14 août 2026*
