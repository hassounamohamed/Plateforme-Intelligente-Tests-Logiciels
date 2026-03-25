"""
Repository pour la gestion des utilisateurs, rôles et permissions
"""
import logging
from typing import Optional, List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, ProgrammingError
from starlette import status

from models.user import Utilisateur, Role, Permission
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class UserRepository(BaseRepository[Utilisateur]):
    """Repository pour les utilisateurs"""
    
    def __init__(self, db: Session):
        super().__init__(Utilisateur, db)
    
    def get_by_email(self, email: str) -> Optional[Utilisateur]:
        """Récupérer un utilisateur par email"""
        try:
            return self.db.query(Utilisateur).filter(Utilisateur.email == email).first()
        except ProgrammingError as exc:
            logger.exception("Database schema error while reading user by email: %s", email)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database schema is outdated. Please apply latest migrations.",
            ) from exc
        except SQLAlchemyError as exc:
            logger.exception("Database error while reading user by email: %s", email)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to read user from database.",
            ) from exc

    def create(self, obj_in: dict) -> Utilisateur:
        """Créer un utilisateur avec rollback explicite en cas d'erreur."""
        try:
            user = Utilisateur(**obj_in)
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            return user
        except ProgrammingError as exc:
            self.db.rollback()
            logger.exception("Database schema error while creating user")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database schema is outdated. Please apply latest migrations.",
            ) from exc
        except SQLAlchemyError as exc:
            self.db.rollback()
            logger.exception("Database error while creating user")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user in database.",
            ) from exc
    
    def get_active_users(self) -> List[Utilisateur]:
        """Récupérer tous les utilisateurs actifs"""
        return self.db.query(Utilisateur).filter(Utilisateur.actif == True).all()
    
    def get_by_role(self, role_id: int) -> List[Utilisateur]:
        """Récupérer tous les utilisateurs d'un rôle spécifique"""
        return self.db.query(Utilisateur).filter(Utilisateur.role_id == role_id).all()
    
    def activate_user(self, user_id: int) -> Optional[Utilisateur]:
        """Activer un utilisateur"""
        user = self.get_by_id(user_id)
        if user:
            user.actif = True
            self.db.commit()
            self.db.refresh(user)
        return user
    
    def deactivate_user(self, user_id: int) -> Optional[Utilisateur]:
        """Désactiver un utilisateur"""
        user = self.get_by_id(user_id)
        if user:
            user.actif = False
            self.db.commit()
            self.db.refresh(user)
        return user
    
    def update_last_login(self, user_id: int) -> Optional[Utilisateur]:
        """Mettre à jour la dernière connexion"""
        from datetime import datetime
        user = self.get_by_id(user_id)
        if user:
            user.derniereConnexion = datetime.utcnow()
            self.db.commit()
            self.db.refresh(user)
        return user


class RoleRepository(BaseRepository[Role]):
    """Repository pour les rôles"""
    
    def __init__(self, db: Session):
        super().__init__(Role, db)
    
    def get_by_code(self, code: str) -> Optional[Role]:
        """Récupérer un rôle par code"""
        return self.db.query(Role).filter(Role.code == code).first()
    
    def get_by_level(self, min_level: int) -> List[Role]:
        """Récupérer les rôles avec un niveau d'accès minimum"""
        return self.db.query(Role).filter(Role.niveau_acces >= min_level).all()
    
    def assign_permissions(self, role_id: int, permission_ids: List[int]) -> Optional[Role]:
        """Assigner des permissions à un rôle"""
        role = self.get_by_id(role_id)
        if role:
            permissions = self.db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
            role.permissions = permissions
            self.db.commit()
            self.db.refresh(role)
        return role
    
    def add_permission(self, role_id: int, permission_id: int) -> Optional[Role]:
        """Ajouter une permission à un rôle"""
        role = self.get_by_id(role_id)
        permission = self.db.query(Permission).filter(Permission.id == permission_id).first()
        if role and permission and permission not in role.permissions:
            role.permissions.append(permission)
            self.db.commit()
            self.db.refresh(role)
        return role
    
    def remove_permission(self, role_id: int, permission_id: int) -> Optional[Role]:
        """Retirer une permission d'un rôle"""
        role = self.get_by_id(role_id)
        permission = self.db.query(Permission).filter(Permission.id == permission_id).first()
        if role and permission and permission in role.permissions:
            role.permissions.remove(permission)
            self.db.commit()
            self.db.refresh(role)
        return role


class PermissionRepository(BaseRepository[Permission]):
    """Repository pour les permissions"""
    
    def __init__(self, db: Session):
        super().__init__(Permission, db)
    
    def get_by_resource_action(self, resource: str, action: str) -> Optional[Permission]:
        """Récupérer une permission par ressource et action"""
        return self.db.query(Permission).filter(
            Permission.resource == resource,
            Permission.action == action
        ).first()
    
    def get_by_resource(self, resource: str) -> List[Permission]:
        """Récupérer toutes les permissions pour une ressource"""
        return self.db.query(Permission).filter(Permission.resource == resource).all()
    
    def get_by_action(self, action: str) -> List[Permission]:
        """Récupérer toutes les permissions pour une action"""
        return self.db.query(Permission).filter(Permission.action == action).all()
