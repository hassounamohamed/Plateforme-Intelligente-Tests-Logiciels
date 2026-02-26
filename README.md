# 🧪 Plateforme Intelligente de Tests Logiciels (PILT)

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

Une plateforme complète de gestion de tests logiciels pour les équipes Agile, intégrant l'intelligence artificielle pour optimiser les processus de QA.

## 📋 Table des Matières

- [Aperçu](#-aperçu)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Structure du Projet](#-structure-du-projet)
- [API Documentation](#-api-documentation)
- [Tests](#-tests)
- [Contribution](#-contribution)

## 🎯 Aperçu

PILT est une plateforme moderne de gestion de tests logiciels conçue pour les équipes Agile. Elle offre une interface intuitive pour gérer les projets, les sprints, les cas de tests et les rapports de bugs, avec un système d'authentification basé sur les rôles.

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
- Création et gestion de projets Agile
- Organisation en sprints
- Attribution des membres d'équipe
- Suivi de l'avancement

### 🧪 Gestion des Tests
- Création de cas de tests détaillés
- Exécution et suivi des tests
- Historique complet des exécutions
- Gestion des statuts (Pass/Fail/Blocked)

### 🐛 Gestion des Bugs
- Signalement et suivi des bugs
- Priorisation et assignation
- Workflow de résolution
- Attachement de fichiers

### 📈 Rapports & Analytics
- Dashboard personnalisé par rôle
- Métriques de qualité
- Rapports d'avancement
- Statistiques d'équipe

## 🏗️ Architecture

### Stack Technologique

**Frontend**
- **Framework**: Next.js 15.1 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **State Management**: React Hooks
- **HTTP Client**: Axios
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Material Symbols

**Backend**
- **Framework**: FastAPI (Python)
- **Database**: MySQL 8.0
- **ORM**: SQLAlchemy
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **API Documentation**: Swagger/OpenAPI

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
│   (MySQL)       │
│   Port 3306     │
└─────────────────┘
```

## 📦 Prérequis

- **Node.js** >= 18.0.0
- **Python** >= 3.11
- **MySQL** >= 8.0
- **npm** ou **yarn**
- **Git**

## 🚀 Installation

### 1. Cloner le Repository

```bash
git clone https://github.com/Plateforme-Intelligente-Tests-Logiciels/Plateforme-Intelligente-Tests-Logiciels.git
cd Plateforme-Intelligente-Tests-Logiciels
```

### 2. Installation du Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Installation du Frontend

```bash
cd ../plateforme-tests
npm install
# ou
yarn install
```

## ⚙️ Configuration

### Configuration du Backend

1. **Créer la base de données MySQL**

```sql
CREATE DATABASE pilt_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Configurer les variables d'environnement**

Créer un fichier `.env` dans le dossier `backend/`:

```env
# Database
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/pilt_db

# JWT
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
FRONTEND_URL=http://localhost:3000
```

3. **Initialiser la base de données**

```bash
python init_db.py
```

Cela créera automatiquement :
- Les 5 rôles utilisateurs
- Un compte Super Admin par défaut :
  - Email: `admin@example.com`
  - Mot de passe: `admin123`

### Configuration du Frontend

Créer un fichier `.env.local` dans le dossier `plateforme-tests/`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## 🎮 Utilisation

### Démarrer le Backend

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend accessible sur : http://localhost:8000
Documentation API : http://localhost:8000/docs

### Démarrer le Frontend

```bash
cd plateforme-tests
npm run dev
# ou
yarn dev
```

Application accessible sur : http://localhost:3000

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
├── backend/                    # API FastAPI
│   ├── database.py            # Configuration DB
│   ├── models.py              # Modèles SQLAlchemy
│   ├── schemas.py             # Schémas Pydantic
│   ├── auth.py                # Logique d'authentification
│   ├── main.py                # Point d'entrée FastAPI
│   ├── init_db.py             # Script d'initialisation DB
│   └── requirements.txt       # Dépendances Python
│
├── plateforme-tests/          # Application Next.js
│   ├── src/
│   │   ├── app/               # App Router Next.js
│   │   │   ├── auth/          # Pages d'authentification
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   └── dashboard/     # Dashboards par rôle
│   │   │       ├── super-admin/
│   │   │       ├── product-owner/
│   │   │       ├── scrum-master/
│   │   │       ├── qa/
│   │   │       └── developer/
│   │   ├── features/          # Fonctionnalités modulaires
│   │   │   ├── auth/          # Module d'authentification
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   └── types/
│   │   │   └── dashboard/     # Module dashboard
│   │   ├── lib/               # Utilitaires
│   │   │   ├── api/           # Client API Axios
│   │   │   └── constants/     # Constantes (routes, rôles)
│   │   └── middleware.ts      # Protection des routes
│   ├── public/                # Assets statiques
│   └── package.json           # Dépendances Node.js
│
└── README.md                  # Ce fichier
```

## 📚 API Documentation

### Endpoints Principaux

#### Authentification
- `POST /auth/sign_up` - Créer un compte
- `POST /auth/sign_in` - Se connecter
- `GET /auth/me` - Obtenir les infos de l'utilisateur connecté

#### Projets
- `GET /projets` - Liste des projets
- `POST /projets` - Créer un projet
- `GET /projets/{id}` - Détails d'un projet
- `PUT /projets/{id}` - Modifier un projet
- `DELETE /projets/{id}` - Supprimer un projet

#### Cas de Tests
- `GET /cas-tests` - Liste des cas de tests
- `POST /cas-tests` - Créer un cas de test
- `GET /cas-tests/{id}` - Détails d'un cas de test
- `PUT /cas-tests/{id}` - Modifier un cas de test
- `DELETE /cas-tests/{id}` - Supprimer un cas de test

Documentation complète disponible sur : http://localhost:8000/docs

## 🧪 Tests

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd plateforme-tests
npm test
# ou
yarn test
```

## 🔒 Sécurité

### Authentification
- JWT avec expiration configurable
- Mots de passe hashés avec bcrypt
- Protection CSRF sur les routes sensibles

### Autorisations
- Middleware de protection des routes
- Vérification des rôles côté backend
- Accès granulaire par rôle

### Bonnes Pratiques
- ✅ Variables d'environnement pour les secrets
- ✅ Validation des entrées avec Pydantic
- ✅ CORS configuré correctement
- ✅ HTTPS recommandé en production

## 🐛 Dépannage

### Problème : Backend ne démarre pas
```bash
# Vérifier que MySQL est actif
mysql -u root -p

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

**Fait avec ❤️ par l'équipe PILT**
