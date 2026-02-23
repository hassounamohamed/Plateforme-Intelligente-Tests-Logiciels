# 🔐 Système de Gestion des Rôles et Permissions (RBAC)

## Vue d'ensemble

Ce système implémente un **Role-Based Access Control (RBAC)** complet pour la plateforme de tests logiciels.

## 📋 Les 5 Rôles Prédéfinis

| Rôle | Code | Niveau d'Accès | Description |
|------|------|----------------|-------------|
| **Super Admin** | `SUPER_ADMIN` | 100 | Gère la plateforme - Accès complet |
| **Product Owner** | `PRODUCT_OWNER` | 80 | Définit les besoins - Gère projets/epics/user stories |
| **Scrum Master** | `SCRUM_MASTER` | 70 | Organise les sprints - Gère le workflow Scrum |
| **Testeur QA** | `TESTEUR_QA` | 60 | Fait les tests - Exécute et valide les tests |
| **Développeur** | `DEVELOPPEUR` | 50 | Code + tests unitaires |

> **Note:** L'IA est un module/service (API), pas un rôle utilisateur.

## 🔑 Système de Permissions

Les permissions sont définies par:
- **Resource** : La ressource concernée (utilisateur, projet, test, etc.)
- **Action** : L'action autorisée (create, read, update, delete, etc.)

### Exemples de permissions :
```
utilisateur:create    → Créer des utilisateurs
projet:read          → Consulter les projets
test:execute         → Exécuter les tests
rapport:generate     → Générer des rapports
```

## 🚀 Démarrage

### 1. Installation

Les dépendances sont déjà dans `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 2. Lancement de l'application

Au démarrage de l'application, les rôles et permissions sont automatiquement initialisés :

```bash
python -m uvicorn main:app --reload
```

Vous verrez dans les logs :
```
🔐 INITIALISATION DES RÔLES ET PERMISSIONS
✓ Permission créée: Créer utilisateur
✓ Permission créée: Lire utilisateur
...
✓ Rôle créé: Super Administrateur
✓ Rôle créé: Product Owner
...
✅ INITIALISATION TERMINÉE AVEC SUCCÈS!
```

## 📖 API Endpoints

### Authentication

#### S'inscrire
```http
POST /auth/sign_up
Content-Type: application/json

{
  "nom": "John Doe",
  "email": "john@example.com",
  "motDePasse": "securepassword",
  "telephone": "+33612345678",
  "role_id": 1
}
```

#### Se connecter
```http
POST /auth/sign_in
Content-Type: application/x-www-form-urlencoded

username=john@example.com&password=securepassword
```

**Réponse:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Obtenir mes informations
```http
GET /auth/me
Authorization: Bearer {token}
```

**Réponse:**
```json
{
  "id": 1,
  "nom": "John Doe",
  "email": "john@example.com",
  "role": {
    "id": 1,
    "nom": "Super Administrateur",
    "code": "SUPER_ADMIN",
    "niveau_acces": 100,
    "permissions": [
      {
        "id": 1,
        "nom": "Créer utilisateur",
        "resource": "utilisateur",
        "action": "create"
      }
    ]
  }
}
```

### Gestion des Rôles (Super Admin uniquement)

#### Lister tous les rôles
```http
GET /roles
Authorization: Bearer {token}
```

#### Obtenir un rôle spécifique
```http
GET /roles/{role_id}
Authorization: Bearer {token}
```

#### Créer un nouveau rôle
```http
POST /roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "nom": "Nouveau Rôle",
  "code": "NOUVEAU_ROLE",
  "description": "Description du rôle",
  "niveau_acces": 30
}
```

#### Modifier un rôle
```http
PUT /roles/{role_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "nom": "Rôle Modifié",
  "description": "Nouvelle description",
  "niveau_acces": 35
}
```

#### Supprimer un rôle
```http
DELETE /roles/{role_id}
Authorization: Bearer {token}
```

### Gestion des Permissions

#### Lister toutes les permissions
```http
GET /roles/permissions
Authorization: Bearer {token}
```

#### Créer une permission
```http
POST /roles/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "nom": "Nouvelle permission",
  "resource": "resource_name",
  "action": "action_name",
  "description": "Description de la permission"
}
```

#### Assigner des permissions à un rôle
```http
POST /roles/{role_id}/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "permission_ids": [1, 2, 3, 4]
}
```

#### Retirer une permission d'un rôle
```http
DELETE /roles/{role_id}/permissions/{permission_id}
Authorization: Bearer {token}
```

### Attribution de Rôles

#### Assigner un rôle à un utilisateur
```http
POST /roles/assign-user
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 1,
  "role_id": 2
}
```

#### Obtenir le rôle d'un utilisateur
```http
GET /roles/user/{user_id}/role
Authorization: Bearer {token}
```

## 💻 Utilisation dans le Code

### Vérifier les permissions dans les routes

```python
from core.rbac import get_current_user_with_role, ROLE_SUPER_ADMIN

@router.post("/mon-endpoint")
async def mon_endpoint(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)]
):
    # Vérifier le rôle
    if current_user.role.code != ROLE_SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    # Votre logique ici
    pass
```

### Utiliser les helpers de vérification

```python
from core.rbac import check_user_has_permission, check_user_has_role

# Vérifier une permission
if check_user_has_permission(user, "projet", "create"):
    # L'utilisateur peut créer des projets
    pass

# Vérifier un rôle
if check_user_has_role(user, ROLE_PRODUCT_OWNER, ROLE_SCRUM_MASTER):
    # L'utilisateur est Product Owner ou Scrum Master
    pass
```

## 🎯 Matrice des Permissions par Rôle

| Permission | Super Admin | Product Owner | Scrum Master | Testeur QA | Développeur |
|------------|:-----------:|:-------------:|:------------:|:----------:|:-----------:|
| **Utilisateurs** |
| Créer utilisateur | ✅ | ❌ | ❌ | ❌ | ❌ |
| Lire utilisateur | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modifier utilisateur | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Rôles** |
| Gérer rôles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assigner rôles | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Projets** |
| CRUD Projets | ✅ | ✅ | ✅ (Read) | ✅ (Read) | ✅ (Read) |
| **Epics** |
| CRUD Epics | ✅ | ✅ | ✅ (Read) | ✅ (Read) | ✅ (Read) |
| **User Stories** |
| CRUD User Stories | ✅ | ✅ | ✅ (RU) | ✅ (Read) | ✅ (RU) |
| **Sprints** |
| CRUD Sprints | ✅ | ✅ (Read) | ✅ | ✅ (Read) | ✅ (Read) |
| **Tests** |
| CRUD Tests | ✅ | ✅ (Read) | ✅ (Read) | ✅ | ✅ (CRU+Exec) |
| Exécuter tests | ✅ | ❌ | ❌ | ✅ | ✅ |
| Valider tests | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Anomalies** |
| CRUD Anomalies | ✅ | ✅ (RU+Assign) | ✅ (RU+Assign) | ✅ | ✅ (CRU) |
| **Rapports** |
| Lire rapports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Créer rapports | ✅ | ❌ | ❌ | ✅ | ❌ |
| Générer rapports | ✅ | ❌ | ❌ | ✅ | ❌ |

**Légende:** C=Create, R=Read, U=Update, D=Delete

> **Note:** Les fonctionnalités de génération automatique (tests, rapports, recommandations) sont gérées par le module IA (API/service), pas par un rôle utilisateur.

## 🔒 Sécurité

- Les mots de passe sont hashés avec bcrypt
- Les tokens JWT ont une durée de validité de 30 jours
- Les permissions sont vérifiées à chaque requête
- Le Super Admin a automatiquement toutes les permissions
- Les comptes désactivés ne peuvent pas se connecter

## 🧪 Tests

Pour créer un Super Admin initial pour les tests :

```python
from passlib.context import CryptContext
from models.user import Utilisateur

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Créer un Super Admin
admin = Utilisateur(
    nom="Super Admin",
    email="admin@plateforme.com",
    motDePasse=bcrypt_context.hash("admin123"),
    telephone="+33600000000",
    role_id=1,  # ID du rôle Super Admin
    actif=True
)
db.add(admin)
db.commit()
```

## 📚 Documentation API Interactive

Une fois l'application lancée, accédez à la documentation Swagger interactive:

```
http://localhost:8000/docs
```

Ou à la documentation ReDoc:

```
http://localhost:8000/redoc
```

## ✅ Checklist d'Implémentation

- [x] Modèles Role et Permission créés
- [x] Système RBAC fonctionnel
- [x] 5 rôles prédéfinis (IA = module/service)
- [x] Permissions par ressource/action
- [x] Interface API de gestion des rôles
- [x] Attribution de permissions aux rôles
- [x] Attribution de rôles aux utilisateurs
- [x] Helpers de vérification des permissions
- [x] Initialisation automatique au démarrage
- [x] Documentation complète

## 🎉 Prêt à l'emploi!

Le système RBAC est maintenant complètement fonctionnel. Au prochain démarrage de l'application, tous les rôles et permissions seront automatiquement créés!
