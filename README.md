# 🧪 Plateforme Intelligente de Tests Logiciels (PILT)

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

Une plateforme de pilotage QA pour centraliser le cahier de tests, l'exécution des cas, les validations Go/No-Go, le suivi des anomalies et les rapports QA, avec génération assistée par IA.

## 📋 Table des Matières

- [Aperçu](#-aperçu)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Suivi des tests](#-suivi-des-tests)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Structure du Projet](#-structure-du-projet)
- [API Documentation](#-api-documentation)
- [Tests](#-tests)
- [Contribution](#-contribution)

## 🎯 Aperçu

PILT est une plateforme QA conçue pour les équipes Agile. Elle couvre la gestion de projets, la génération du cahier de tests, la création et l'exécution des cas de test, la validation fonctionnelle et la production de rapports QA.

### Captures d'écran

```
[Login Page]  →  [Dashboard]  →  [Project Management]
```

## ✨ Fonctionnalités

### 🔐 Authentification & Autorisation
- ✅ Système de connexion sécurisé avec JWT
- ✅ 5 rôles utilisateurs distincts :
  - **Super Administrateur** - Gestion complète de la plateforme
  - **Product Owner** - Gestion des fonctionnalités et priorités
  - **Scrum Master** - Coordination des sprints et équipes
  - **Testeur QA** - Création et exécution des tests
  - **Développeur** - Suivi des bugs et développement
- ✅ Protection des routes avec middleware
- ✅ Redirections automatiques selon le rôle

### 📊 Gestion de Projets
- Création et suivi de projets Agile
- Découpage en modules, epics, user stories et sprints
- Attribution des membres d'équipe
- Historique d'activité et vue synthétique par rôle

### 🧪 Cycle de Vie des Tests
- Génération du cahier de tests global, manuelle ou assistée par IA
- Création de cas de test par user story
- Suivi des types de tests: manuel, automatisé, unitaire, intégration et E2E
- Exécution, historique des exécutions et statut détaillé des cas
- Validation Go/No-Go et gestion des anomalies liées aux résultats

### 📈 Rapports & Analytics
- Rapport QA avec taux de réussite, couverture et indicateurs qualité
- Export des rapports en PDF et Word
- Tableau de bord super admin avec activité et exécutions de tests
- Vue orientée décision pour le pilotage QA

### 🤖 Assistance IA
- Génération de tests unitaires à partir d'un fichier source
- Génération du cahier de tests global à partir d'une user story
- Support des clés API IA personnalisées selon l'utilisateur

## 🏗️ Architecture

### Stack Technologique

**Frontend**
- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19, Mantine, Radix UI et composants internes
- **Styling**: Tailwind CSS 4
- **State Management**: React Hooks et TanStack Query
- **HTTP Client**: Axios
- **Charts**: Recharts

**Backend**
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: JWT et sessions OAuth
- **API Documentation**: Swagger/OpenAPI

**Déploiement**
- `docker-compose.yml` orchestre le backend, le frontend, PostgreSQL et Nginx

**Architecture**
```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   Port 3000     │
└────────┬────────┘
         │ HTTP/REST
         │ JWT Auth
         │
┌────────▼────────┐
│   Backend       │
│   (FastAPI)     │
│   Port 8000     │
└────────┬────────┘
         │ SQL
         │
┌────────▼────────┐
│   Database      │
│   (PostgreSQL)   │
│   Port 5432     │
└─────────────────┘
```

## 📦 Prérequis

- **Node.js** >= 18.18, recommandé 20+
- **Python** >= 3.11
- **PostgreSQL** >= 15
- **npm**
- **Git**

## 🚀 Installation

### 1. Cloner le Repository

```bash
git clone https://github.com/Plateforme-Intelligente-Tests-Logiciels/Plateforme-Intelligente-Tests-Logiciels.git
cd Plateforme-Intelligente-Tests-Logiciels
```

### 2. Installation du Backend

```bash
cd plateforme-back
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Installation du Frontend

```bash
cd ../plateforme-tests
npm install
```

### 4. Option Docker

```bash
docker compose up --build
```

## ⚙️ Configuration

### Configuration du Backend

1. **Créer la base de données PostgreSQL**

```sql
CREATE DATABASE plateforme;
```

2. **Configurer les variables d'environnement**

Créer un fichier `.env` dans le dossier `plateforme-back/`:

```env
# Database
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/plateforme

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
SESSION_SECRET_KEY=your-session-secret
ENCRYPTION_KEY=your-fernet-key

# JWT / App
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
FRONTEND_BASE_URL=http://localhost:3000

# AI
AI_API_KEY=your-openrouter-key
AI_MODEL=google/gemma-3-12b-it
```

3. **Initialiser la base de données**

```bash
alembic upgrade head
```

Cela applique le schéma et les migrations. Les scripts `seed_roles.py` et `seed_admin.py` peuvent ensuite être utilisés pour précharger les rôles et un compte Super Admin si nécessaire.

### Configuration du Frontend

Créer un fichier `.env.local` dans le dossier `plateforme-tests/`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## 🎮 Utilisation

### Démarrer le Backend

```bash
cd plateforme-back
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend accessible sur : http://localhost:8000
Documentation API : http://localhost:8000/docs

### Démarrer le Frontend

```bash
cd plateforme-tests
npm run dev
```

Application accessible sur : http://localhost:3000

## 🧪 Suivi des tests

Le suivi QA est structuré autour de plusieurs niveaux de traçabilité:

- Cahier de tests global par projet, généré manuellement ou via IA.
- Cas de test liés aux user stories, avec statut, type de test, durée estimée et historique.
- Exécutions de tests avec horodatage, résultat, logs, capture écran et anomalie associée.
- Validation Go/No-Go pour les tests manuels et les tests unitaires/automatisés selon le workflow.
- Rapport QA consolidé avec taux de réussite, nombre de tests exécutés, anomalies et export documentaire.

### Statuts de test

- `Non exécuté`
- `En cours`
- `Réussi`
- `Échoué`
- `Bloqué`

### Types de test

- `Manuel`
- `Automatisé`
- `Unitaire`
- `Intégration`
- `E2E`

### Endpoints utiles

- `POST /projets/{projet_id}/cahier-tests/generate` pour générer le cahier global.
- `GET /projets/{projet_id}/cahier-tests/detail` pour consulter le cahier et ses cas.
- `GET /projets/{projet_id}/userstories/{us_id}/unit-tests` pour voir les tests unitaires d'une user story.
- `POST /projets/{projet_id}/userstories/{us_id}/unit-tests/{test_id}/execute` pour exécuter un test.
- `POST /projets/{projet_id}/userstories/{us_id}/unit-tests/{test_id}/validate` pour valider ou rejeter un test.
- `GET /projets/{projet_id}/userstories/{us_id}/unit-tests/{test_id}/executions` pour l'historique des exécutions.
- `POST /projets/{projet_id}/rapports/cahier/{cahier_id}/generate` pour générer un rapport QA.
- `GET /projets/{projet_id}/rapports/cahier/{cahier_id}/export/pdf` et `/export/word` pour l'export.

### Première Connexion

1. Ouvrir http://localhost:3000/auth/login
2. Se connecter avec :
   - **Email**: `admin@example.com`
   - **Mot de passe**: `admin123`
3. Vous serez redirigé vers `/dashboard/super-admin`

### Créer d'Autres Utilisateurs

Utiliser la page d'inscription ou l'API :

```bash
# Créer un développeur
curl -X POST http://127.0.0.1:8000/auth/sign_up \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "John Developer",
    "email": "dev@example.com",
    "motDePasse": "dev123",
    "role_id": 5
  }'
```

**IDs des rôles** :
- `1` = Super Administrateur
- `2` = Product Owner
- `3` = Scrum Master
- `4` = Testeur QA
- `5` = Développeur

## 📁 Structure du Projet

```
PILT/
├── plateforme-back/            # API FastAPI
│   ├── api/                    # Routes REST
│   ├── core/                   # Configuration, sécurité et RBAC
│   ├── db/                     # Session SQLAlchemy et connexion DB
│   ├── migrations/             # Alembic
│   ├── models/                 # Modèles SQLAlchemy
│   ├── repositories/           # Accès aux données
│   ├── schemas/                # Schémas Pydantic
│   ├── services/               # Logique métier
│   ├── seed_admin.py           # Seed du super admin
│   ├── seed_roles.py           # Seed des rôles
│   └── main.py                 # Point d'entrée FastAPI
│
├── plateforme-tests/           # Application Next.js
│   ├── src/
│   │   ├── app/                # App Router
│   │   ├── components/         # Composants UI
│   │   ├── features/           # Domaines fonctionnels
│   │   ├── hooks/              # Hooks partagés
│   │   ├── lib/                # Client API et constantes
│   │   ├── types/              # Types partagés
│   │   └── middleware.ts       # Protection des routes
│   └── public/                 # Assets statiques
│
├── docker-compose.yml          # Orchestration locale
├── nginx/                      # Reverse proxy
└── README.md                   # Ce fichier
```

## 📚 API Documentation

### Endpoints Principaux

#### Authentification
- `POST /auth/register` - Créer un compte
- `POST /auth/login` - Se connecter
- `GET /auth/me` - Obtenir les infos de l'utilisateur connecté

#### Suivi des tests
- `POST /projets/{projet_id}/cahier-tests/generate` - Générer le cahier global
- `GET /projets/{projet_id}/cahier-tests/detail` - Consulter le cahier et les cas
- `POST /projets/{projet_id}/userstories/{us_id}/unit-tests/generate` - Générer des tests unitaires via IA
- `POST /projets/{projet_id}/userstories/{us_id}/unit-tests/{test_id}/execute` - Exécuter un test
- `POST /projets/{projet_id}/userstories/{us_id}/unit-tests/{test_id}/validate` - Valider ou rejeter un test
- `GET /projets/{projet_id}/userstories/{us_id}/unit-tests/{test_id}/executions` - Historique des exécutions
- `POST /projets/{projet_id}/rapports/cahier/{cahier_id}/generate` - Générer un rapport QA
- `GET /projets/{projet_id}/rapports/cahier/{cahier_id}` - Consulter le rapport QA
- `GET /projets/{projet_id}/rapports/cahier/{cahier_id}/export/pdf` - Export PDF
- `GET /projets/{projet_id}/rapports/cahier/{cahier_id}/export/word` - Export Word

Documentation complète disponible sur : http://localhost:8000/docs

## 🧪 Tests

### Backend Tests

```bash
cd plateforme-back
pytest
```

### Frontend Checks

```bash
cd plateforme-tests
npm run lint
npm run build
```

Le frontend n'expose pas encore de script `test` dédié; la validation courante passe par le lint et le build.

## 🔒 Sécurité

### Authentification
- JWT avec expiration configurable
- Sessions OAuth pour les connexions externes
- Mots de passe hashés côté backend

### Autorisations
- Middleware de protection des routes frontend
- Vérification des rôles côté backend
- Accès granulaire par rôle et par contexte projet

### Bonnes Pratiques
- ✅ Variables d'environnement pour les secrets
- ✅ Validation des entrées avec Pydantic
- ✅ CORS configuré pour le frontend local
- ✅ Chiffrement des clés API IA personnalisées

## 🐛 Dépannage

### Problème : Backend ne démarre pas
```bash
# Vérifier que PostgreSQL est actif
psql -h localhost -U postgres -d plateforme

# Vérifier les dépendances
pip install -r requirements.txt
```

### Problème : Frontend ne se connecte pas au backend
```bash
# Vérifier NEXT_PUBLIC_API_URL dans .env.local
echo $NEXT_PUBLIC_API_URL

# Vérifier que le backend tourne
curl http://localhost:8000/docs
```

### Problème : Erreur 401 après login
```bash
# Vérifier le token dans la console
localStorage.getItem('access_token')

# Vérifier les cookies
document.cookie
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'feat: Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Convention de Commits

Suivre [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat: nouvelle fonctionnalité
fix: correction de bug
docs: documentation
style: formatage
refactor: refactoring
test: ajout de tests
chore: tâches diverses
```

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Équipe

- **Product Owner** - Gestion des fonctionnalités
- **Scrum Master** - Coordination Agile
- **Développeurs** - Implémentation
- **QA Team** - Tests et qualité

## 📞 Support

- 📧 Email: support@pilt-platform.com
- 🐛 Issues: [GitHub Issues](https://github.com/Plateforme-Intelligente-Tests-Logiciels/Plateforme-Intelligente-Tests-Logiciels/issues)
- 📖 Documentation: [Wiki](https://github.com/Plateforme-Intelligente-Tests-Logiciels/Plateforme-Intelligente-Tests-Logiciels/wiki)

---

