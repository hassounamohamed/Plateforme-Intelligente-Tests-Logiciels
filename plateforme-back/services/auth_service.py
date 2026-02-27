from typing import Optional

from fastapi import HTTPException
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from starlette import status

from core.config import SECRET_KEY, ALGORITHM
from core.security import create_access_token
from models.user import Utilisateur, Role
from repositories.user_repository import UserRepository
from repositories.log_repository import AuditLogRepository
from schemas.user import CreateUserRequest

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service métier pour l'authentification — injecter via Depends."""

    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.audit_repo = AuditLogRepository(db)

    # =========================================================
    # PASSWORD
    # =========================================================

    def hash_password(self, password: str) -> str:
        """Hacher un mot de passe (limite bcrypt 72 bytes)."""
        return bcrypt_context.hash(password[:72])

    def verify_password(self, plain: str, hashed: str) -> bool:
        """Vérifier un mot de passe contre son hash."""
        return bcrypt_context.verify(plain[:72], hashed)

    # =========================================================
    # TOKEN
    # =========================================================

    def generate_token(self, user: Utilisateur) -> str:
        """Générer un JWT access token pour l'utilisateur."""
        token_data = {"sub": str(user.id)}
        if user.role:
            token_data["role"] = user.role.code
        return create_access_token(token_data)

    def build_token_response(self, user: Utilisateur, token: str) -> dict:
        """Construire la réponse complète du login avec rôle."""
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.id,
            "nom": user.nom,
            "email": user.email,
            "role": {
                "id": user.role.id,
                "nom": user.role.nom,
                "code": user.role.code,
                "niveau_acces": user.role.niveau_acces,
            } if user.role else None,
        }

    # =========================================================
    # REGISTER
    # =========================================================

    def register(self, request: CreateUserRequest) -> dict:
        """
        Créer un nouvel utilisateur.
        - Vérifie l'unicité de l'email
        - Vérifie que le rôle existe
        - Hache le mot de passe (72 bytes max)
        - Retourne l'id et le role_id du nouvel utilisateur
        """
        print(f"[DEBUG] Starting registration for: {request.email}")
        
        existing = self.user_repo.get_by_email(request.email)
        if existing:
            print(f"[DEBUG] Email already exists: {request.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email déjà utilisé",
            )
        
        # Vérifier que le rôle existe
        print(f"[DEBUG] Checking role_id: {request.role_id}")
        role = self.db.query(Role).filter_by(id=request.role_id).first()
        if not role:
            print(f"[DEBUG] Role not found: {request.role_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le rôle avec l'ID {request.role_id} n'existe pas",
            )
        
        print(f"[DEBUG] Role found: {role.nom}")
        
        new_user = Utilisateur(
            nom=request.nom,
            email=request.email,
            motDePasse=self.hash_password(request.motDePasse),
            telephone=request.telephone,
            role_id=request.role_id,
            actif=False,
        )

        print(f"[DEBUG] Adding user to database...")
        try:
            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)
            print(f"[DEBUG] User created with ID: {new_user.id}")
        except Exception as e:
            print(f"[ERROR] Database error: {str(e)}")
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors de la création de l'utilisateur: {str(e)}",
            )

        try:
            self.audit_repo.log_action(
                user_id=new_user.id,
                action="USER_CREATED",
                entity_type="user",
                entity_id=str(new_user.id),
                changes=f"email={new_user.email}, role_id={new_user.role_id}",
            )
            print(f"[DEBUG] Audit log created")
        except Exception as e:
            print(f"[WARNING] Failed to create audit log: {str(e)}")

        return {
            "message": "Utilisateur créé avec succès",
            "user_id": new_user.id,
            "role_id": new_user.role_id,
        }

    # =========================================================
    # LOGIN
    # =========================================================

    def authenticate(self, email: str, password: str) -> Optional[Utilisateur]:
        """
        Vérifier les identifiants.
        Retourne l'utilisateur si valide, None sinon.
        """
        user = self.user_repo.get_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.motDePasse):
            return None
        return user

    def login(self, email: str, password: str, ip_address: Optional[str] = None) -> dict:
        """
        Authentifier un utilisateur et retourner le token avec ses infos.
        Lève HTTP 401 si les identifiants sont invalides.
        Lève HTTP 403 si le compte n'est pas activé.
        """
        user = self.authenticate(email, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect",
            )

        # Vérifier si le compte est activé par le Super Administrateur
        if not user.actif:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Compte en attente d'activation par le Super Administrateur",
            )

        token = self.generate_token(user)
        self.user_repo.update_last_login(user.id)

        self.audit_repo.log_action(
            user_id=user.id,
            action="USER_LOGIN",
            entity_type="user",
            entity_id=str(user.id),
            ip_address=ip_address,
        )

        return self.build_token_response(user, token)

    def activate_user(self, user_id: int) -> dict:
        """Active le compte d'un utilisateur (Super Admin uniquement)."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
        self.user_repo.activate_user(user_id)
        self.audit_repo.log_action(user_id=user_id, action="USER_ACTIVATED", entity_type="user", entity_id=str(user_id))
        return {"message": "Compte activé avec succès", "user_id": user_id}

    def deactivate_user(self, user_id: int) -> dict:
        """Désactive le compte d'un utilisateur (Super Admin uniquement)."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
        self.user_repo.deactivate_user(user_id)
        self.audit_repo.log_action(user_id=user_id, action="USER_DEACTIVATED", entity_type="user", entity_id=str(user_id))
        return {"message": "Compte désactivé avec succès", "user_id": user_id}

    def delete_user(self, user_id: int) -> dict:
        """Supprime définitivement un utilisateur (Super Admin uniquement)."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
        
        # Log avant suppression
        self.audit_repo.log_action(
            user_id=user_id,
            action="USER_DELETED",
            entity_type="user",
            entity_id=str(user_id)
        )
        
        # Supprimer l'utilisateur
        success = self.user_repo.delete(user_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur lors de la suppression de l'utilisateur"
            )
        
        return {"message": "Utilisateur supprimé avec succès", "user_id": user_id}

    def get_all_users(self) -> list:
        """Lister tous les utilisateurs avec leurs infos (Super Admin uniquement)."""
        users = self.db.query(Utilisateur).all()
        return [
            {
                "id": u.id,
                "nom": u.nom,
                "email": u.email,
                "telephone": u.telephone,
                "actif": u.actif,
                "dateCreation": u.dateCreation,
                "derniereConnexion": u.derniereConnexion,
                "role": {"id": u.role.id, "nom": u.role.nom, "code": u.role.code} if u.role else None,
            }
            for u in users
        ]

    def get_pending_users(self) -> list:
        """Lister les comptes en attente d'activation (Super Admin uniquement)."""
        users = self.db.query(Utilisateur).filter(Utilisateur.actif == False).all()
        return [
            {
                "id": u.id,
                "nom": u.nom,
                "email": u.email,
                "telephone": u.telephone,
                "actif": u.actif,
                "dateCreation": u.dateCreation,
                "derniereConnexion": u.derniereConnexion,
                "role": {"id": u.role.id, "nom": u.role.nom, "code": u.role.code} if u.role else None,
            }
            for u in users
        ]

    def change_password(self, user_id: int, ancien_mot_de_passe: str, nouveau_mot_de_passe: str) -> dict:
        """Changer le mot de passe de l'utilisateur connecté."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
        if not self.verify_password(ancien_mot_de_passe, user.motDePasse):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ancien mot de passe incorrect")
        user.motDePasse = self.hash_password(nouveau_mot_de_passe)
        self.db.commit()
        self.audit_repo.log_action(user_id=user_id, action="PASSWORD_CHANGED", entity_type="user", entity_id=str(user_id))
        return {"message": "Mot de passe modifié avec succès"}

    def update_profile(self, user_id: int, nom: Optional[str] = None, telephone: Optional[str] = None) -> dict:
        """Mettre à jour le nom et/ou téléphone de l'utilisateur connecté."""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
        if nom is not None:
            user.nom = nom
        if telephone is not None:
            user.telephone = telephone
        self.db.commit()
        self.db.refresh(user)
        self.audit_repo.log_action(user_id=user_id, action="PROFILE_UPDATED", entity_type="user", entity_id=str(user_id))
        return {"message": "Profil mis à jour avec succès", "id": user.id, "nom": user.nom, "email": user.email, "telephone": user.telephone}

    # =========================================================
    # PROFIL
    # =========================================================

    def get_profile(self, user_id: int) -> dict:
        """
        Récupérer le profil complet d'un utilisateur (utilisé par /me).
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé",
            )

        response = {
            "id": user.id,
            "nom": user.nom,
            "email": user.email,
            "telephone": user.telephone,
            "role_id": user.role_id,
            "actif": user.actif,
        }

        if user.role:
            response["role"] = {
                "id": user.role.id,
                "nom": user.role.nom,
                "code": user.role.code,
                "description": user.role.description,
                "niveau_acces": user.role.niveau_acces,
                "permissions": [
                    {
                        "id": p.id,
                        "nom": p.nom,
                        "resource": p.resource,
                        "action": p.action,
                    }
                    for p in user.role.permissions
                ],
            }

        return response
