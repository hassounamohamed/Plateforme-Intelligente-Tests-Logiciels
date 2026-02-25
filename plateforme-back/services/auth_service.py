from typing import Optional

from fastapi import HTTPException
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from starlette import status

from core.config import SECRET_KEY, ALGORITHM
from core.security import create_access_token
from models.user import Utilisateur
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
        return create_access_token({"sub": str(user.id)})

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
        - Hache le mot de passe (72 bytes max)
        - Retourne l'id et le role_id du nouvel utilisateur
        """
        existing = self.user_repo.get_by_email(request.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email déjà utilisé",
            )

        new_user = Utilisateur(
            nom=request.nom,
            email=request.email,
            motDePasse=self.hash_password(request.motDePasse),
            telephone=request.telephone,
            role_id=request.role_id,
        )

        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)

        self.audit_repo.log_action(
            user_id=new_user.id,
            action="USER_CREATED",
            entity_type="user",
            entity_id=str(new_user.id),
            changes=f"email={new_user.email}, role_id={new_user.role_id}",
        )

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
        """
        user = self.authenticate(email, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect",
            )

        token = self.generate_token(user)

        self.audit_repo.log_action(
            user_id=user.id,
            action="USER_LOGIN",
            entity_type="user",
            entity_id=str(user.id),
            ip_address=ip_address,
        )

        return self.build_token_response(user, token)

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
