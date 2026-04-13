# Plateforme Intelligente de Tests Logiciels - Frontend

Application Next.js du projet PILT. Elle fournit les parcours d'authentification, les dashboards par rôle et les écrans de suivi QA pour les projets, les user stories, les cahiers de tests, les exécutions et les rapports.

## Prérequis

- Node.js 18.18 ou plus
- npm
- Le backend PILT accessible via `NEXT_PUBLIC_API_URL`

## Installation

```bash
npm install
```

## Variables d'environnement

Créer un fichier `.env.local` à la racine du dossier `plateforme-tests/`.

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Scripts

- `npm run dev` : lance le frontend en local
- `npm run build` : construit l'application pour la production
- `npm run start` : démarre l'application compilée
- `npm run lint` : vérifie la qualité du code

## Démarrage

```bash
npm run dev
```

L'application est disponible sur http://localhost:3000.

## Parcours principaux

- Authentification et sélection de rôle
- Dashboard super administrateur
- Dashboard product owner
- Dashboard scrum master
- Dashboard testeur QA
- Dashboard développeur
- Cahier de tests global
- Tests unitaires par user story
- Rapport QA et export documentaire

## Structure utile

- `src/app/` : routes et pages
- `src/components/` : composants partagés
- `src/features/` : fonctionnalités métier
- `src/lib/` : client API, constantes et helpers
- `src/types/` : types partagés

## Tests et validation

Ce frontend n'expose pas encore de script de test dédié. La validation courante passe par `npm run lint` et `npm run build`.
