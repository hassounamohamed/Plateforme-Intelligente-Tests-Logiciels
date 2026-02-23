# Repositories - Couche d'Accès aux Données

Ce dossier contient tous les repositories pour gérer les opérations CRUD avec la base de données. L'architecture Repository Pattern sépare la logique métier de la logique d'accès aux données.

## 📁 Structure

```
repositories/
├── base_repository.py           # Repository de base avec CRUD générique
├── user_repository.py           # Utilisateurs, Rôles, Permissions
├── scrum_repository.py          # Projet, Module, Epic, Sprint, UserStory
├── test_repository.py           # CahierDeTests, Test, Scenario, Validation
├── anomalie_repository.py       # Anomalies
├── execution_repository.py      # ExecutionTest, ResultatTest
├── notification_repository.py   # Notifications
├── rapport_repository.py        # RapportQA, Indicateurs, Recommandations
├── log_repository.py           # LogSystems, AuditLog
└── __init__.py                 # Exports publics
```

## 🎯 Utilisation

### 1. Importer un Repository

```python
from sqlalchemy.orm import Session
from repositories import UserRepository, ProjetRepository
from db.database import get_db

# Dans une route FastAPI
@router.get("/users")
async def get_users(db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    users = user_repo.get_all()
    return users
```

### 2. Opérations CRUD de Base

Tous les repositories héritent de `BaseRepository` qui fournit :

```python
# Créer
user_data = {"nom": "John", "email": "john@example.com", "motDePasse": "hashed_pwd"}
user = user_repo.create(user_data)

# Lire (par ID)
user = user_repo.get_by_id(1)

# Lire (tous)
users = user_repo.get_all(skip=0, limit=100)

# Mettre à jour
update_data = {"nom": "John Doe"}
user = user_repo.update(1, update_data)

# Supprimer
success = user_repo.delete(1)

# Compter
total = user_repo.count()

# Vérifier l'existence
exists = user_repo.exists(1)
```

### 3. Méthodes Spécifiques par Repository

#### UserRepository
```python
from repositories import UserRepository

user_repo = UserRepository(db)

# Récupérer par email
user = user_repo.get_by_email("john@example.com")

# Récupérer utilisateurs actifs
active_users = user_repo.get_active_users()

# Récupérer par rôle
admins = user_repo.get_by_role(role_id=1)

# Activer/Désactiver
user_repo.activate_user(user_id=1)
user_repo.deactivate_user(user_id=2)

# Mettre à jour dernière connexion
user_repo.update_last_login(user_id=1)
```

#### RoleRepository
```python
from repositories import RoleRepository

role_repo = RoleRepository(db)

# Récupérer par code
role = role_repo.get_by_code("SUPER_ADMIN")

# Gérer les permissions
role_repo.assign_permissions(role_id=1, permission_ids=[1, 2, 3])
role_repo.add_permission(role_id=1, permission_id=4)
role_repo.remove_permission(role_id=1, permission_id=2)
```

#### ProjetRepository
```python
from repositories import ProjetRepository

projet_repo = ProjetRepository(db)

# Projets d'un Product Owner
projets = projet_repo.get_by_product_owner(user_id=1)

# Projets par statut
projets_actifs = projet_repo.get_by_status("EN_COURS")

# Projets actifs uniquement
projets = projet_repo.get_active_projects()
```

#### SprintRepository
```python
from repositories import SprintRepository

sprint_repo = SprintRepository(db)

# Sprint actuel d'un projet
current = sprint_repo.get_current_sprint(projet_id=1)

# Ajouter des user stories
sprint_repo.add_user_stories(sprint_id=1, userstory_ids=[1, 2, 3])
```

#### AnomalieRepository
```python
from repositories import AnomalieRepository

anomalie_repo = AnomalieRepository(db)

# Anomalies critiques ouvertes
critiques = anomalie_repo.get_critical_anomalies()

# Résoudre/Assigner/Réouvrir
anomalie_repo.resolve_anomalie(anomalie_id=1)
anomalie_repo.assign_anomalie(anomalie_id=1, user_id=2)
anomalie_repo.reopen_anomalie(anomalie_id=1)
```

#### NotificationRepository
```python
from repositories import NotificationRepository

notif_repo = NotificationRepository(db)

# Notifications non lues
unread = notif_repo.get_unread(destinataire_id=1)

# Marquer comme lue(s)
notif_repo.mark_as_read(notification_id=1)
notif_repo.mark_all_as_read(destinataire_id=1)

# Compter non lues
count = notif_repo.count_unread(destinataire_id=1)

# Nettoyer anciennes notifications
deleted = notif_repo.delete_old_notifications(days=30)
```

#### AuditLogRepository
```python
from repositories import AuditLogRepository

audit_repo = AuditLogRepository(db)

# Logger une action
audit_repo.log_action(
    user_id=1,
    action="UPDATE",
    entity_type="User",
    entity_id=5,
    changes='{"nom": "old" -> "new"}',
    ip_address="192.168.1.1",
    user_agent="Mozilla/5.0..."
)

# Récupérer l'activité
activity = audit_repo.get_user_activity(user_id=1, days=30)
```

## 🏗️ Architecture

### Pattern Repository

1. **Séparation des préoccupations** : La logique d'accès aux données est isolée
2. **Testabilité** : Facile à mocker pour les tests unitaires
3. **Réutilisabilité** : Méthodes communes partagées via `BaseRepository`
4. **Maintenabilité** : Changements de DB localisés dans les repositories

### Bonnes Pratiques

```python
# ❌ Mauvais : Accès direct à la DB dans les routes
@router.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
    return user

# ✅ Bon : Utiliser le Repository
@router.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

## 🔧 Extension

Pour ajouter une méthode à un repository :

```python
class UserRepository(BaseRepository[Utilisateur]):
    # ... méthodes existantes ...
    
    def get_by_phone(self, phone: str) -> Optional[Utilisateur]:
        """Récupérer un utilisateur par téléphone"""
        return self.db.query(Utilisateur).filter(
            Utilisateur.telephone == phone
        ).first()
```

## 📊 Avantages

- ✅ **Code DRY** : Pas de duplication des requêtes
- ✅ **Type-safe** : Avec génériques Python
- ✅ **Centralisé** : Un seul endroit pour les requêtes DB
- ✅ **Évolutif** : Facile d'ajouter de nouvelles méthodes
- ✅ **Testable** : Peut être mocké facilement
- ✅ **Transaction-safe** : Gestion cohérente des commits

## 🎓 Exemples Complets

### Création d'un Utilisateur avec Rôle

```python
from repositories import UserRepository, RoleRepository
from core.security import hash_password

user_repo = UserRepository(db)
role_repo = RoleRepository(db)

# Récupérer le rôle
role = role_repo.get_by_code("DEVELOPPEUR")

# Créer l'utilisateur
user_data = {
    "nom": "John Doe",
    "email": "john@example.com",
    "motDePasse": hash_password("password123"),
    "telephone": "+33123456789",
    "role_id": role.id
}
user = user_repo.create(user_data)
```

### Gestion d'un Sprint

```python
from repositories import SprintRepository, UserStoryRepository

sprint_repo = SprintRepository(db)
us_repo = UserStoryRepository(db)

# Créer le sprint
sprint_data = {
    "nom": "Sprint 1",
    "dateDebut": datetime.now(),
    "dateFin": datetime.now() + timedelta(days=14),
    "statut": "PLANIFIE",
    "projet_id": 1,
    "scrumMasterId": 2
}
sprint = sprint_repo.create(sprint_data)

# Récupérer le backlog et ajouter des user stories
backlog = us_repo.get_backlog(epic_id=1)
us_ids = [us.id for us in backlog[:5]]  # 5 premières US
sprint_repo.add_user_stories(sprint.id, us_ids)
```
