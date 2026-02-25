from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session
from starlette import status

from models.user import Utilisateur, Role, Permission
from repositories.user_repository import RoleRepository, PermissionRepository, UserRepository
from repositories.log_repository import AuditLogRepository
from core.rbac.constants import ROLE_SUPER_ADMIN


class RolesService:
    """Service métier pour la gestion des rôles et permissions — injecter via Depends."""

    def __init__(self, db: Session):
        self.db = db
        self.role_repo = RoleRepository(db)
        self.perm_repo = PermissionRepository(db)
        self.user_repo = UserRepository(db)
        self.audit_repo = AuditLogRepository(db)

    # =========================================================
    # GUARD
    # =========================================================

    def _require_super_admin(self, user: Utilisateur) -> None:
        if not user.role or user.role.code != ROLE_SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seul le Super Admin peut effectuer cette action",
            )

    # =========================================================
    # PERMISSIONS
    # =========================================================

    def get_all_permissions(self, current_user: Utilisateur) -> List[Permission]:
        self._require_super_admin(current_user)
        return self.perm_repo.get_all()

    def create_permission(
        self,
        current_user: Utilisateur,
        nom: str,
        resource: str,
        action: str,
        description: Optional[str] = None,
    ) -> Permission:
        self._require_super_admin(current_user)

        existing = self.perm_repo.get_by_resource_action(resource, action)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Permission {action} sur {resource} existe déjà",
            )

        new_perm = Permission(
            nom=nom,
            resource=resource,
            action=action,
            description=description,
        )
        self.db.add(new_perm)
        self.db.commit()
        self.db.refresh(new_perm)

        self.audit_repo.log_action(
            user_id=current_user.id,
            action="PERMISSION_CREATED",
            entity_type="permission",
            entity_id=str(new_perm.id),
            changes=f"nom={nom}, resource={resource}, action={action}",
        )

        return new_perm

    # =========================================================
    # ROLES CRUD
    # =========================================================

    def get_all_roles(self, current_user: Utilisateur) -> List[Role]:
        self._require_super_admin(current_user)
        return self.role_repo.get_all()

    def get_role_by_id(self, current_user: Utilisateur, role_id: int) -> Role:
        self._require_super_admin(current_user)
        role = self.role_repo.get_by_id(role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rôle avec ID {role_id} non trouvé",
            )
        return role

    def create_role(
        self,
        current_user: Utilisateur,
        nom: str,
        code: str,
        description: Optional[str],
        niveau_acces: int,
    ) -> Role:
        self._require_super_admin(current_user)

        if self.role_repo.get_by_code(code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le code de rôle '{code}' existe déjà",
            )

        new_role = Role(
            nom=nom,
            code=code,
            description=description,
            niveau_acces=niveau_acces,
        )
        self.db.add(new_role)
        self.db.commit()
        self.db.refresh(new_role)

        self.audit_repo.log_action(
            user_id=current_user.id,
            action="ROLE_CREATED",
            entity_type="role",
            entity_id=str(new_role.id),
            changes=f"nom={nom}, code={code}, niveau_acces={niveau_acces}",
        )

        return new_role

    def update_role(
        self,
        current_user: Utilisateur,
        role_id: int,
        nom: Optional[str],
        description: Optional[str],
        niveau_acces: Optional[int],
    ) -> Role:
        self._require_super_admin(current_user)

        role = self.role_repo.get_by_id(role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rôle avec ID {role_id} non trouvé",
            )

        changes = []
        if nom is not None:
            changes.append(f"nom: {role.nom} → {nom}")
            role.nom = nom
        if description is not None:
            changes.append(f"description: {role.description} → {description}")
            role.description = description
        if niveau_acces is not None:
            changes.append(f"niveau_acces: {role.niveau_acces} → {niveau_acces}")
            role.niveau_acces = niveau_acces

        self.db.commit()
        self.db.refresh(role)

        if changes:
            self.audit_repo.log_action(
                user_id=current_user.id,
                action="ROLE_UPDATED",
                entity_type="role",
                entity_id=str(role_id),
                changes=", ".join(changes),
            )

        return role

    def delete_role(self, current_user: Utilisateur, role_id: int) -> None:
        self._require_super_admin(current_user)

        role = self.role_repo.get_by_id(role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rôle avec ID {role_id} non trouvé",
            )

        users_count = self.db.query(Utilisateur).filter(Utilisateur.role_id == role_id).count()
        if users_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Impossible de supprimer: {users_count} utilisateur(s) ont ce rôle",
            )

        role_nom = role.nom
        self.db.delete(role)
        self.db.commit()

        self.audit_repo.log_action(
            user_id=current_user.id,
            action="ROLE_DELETED",
            entity_type="role",
            entity_id=str(role_id),
            changes=f"nom={role_nom}",
        )

    # =========================================================
    # PERMISSIONS ↔ ROLES
    # =========================================================

    def assign_permissions_to_role(
        self,
        current_user: Utilisateur,
        role_id: int,
        permission_ids: List[int],
    ) -> Role:
        self._require_super_admin(current_user)

        role = self.role_repo.get_by_id(role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rôle avec ID {role_id} non trouvé",
            )

        permissions = self.db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
        if len(permissions) != len(permission_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Certaines permissions spécifiées n'existent pas",
            )

        role.permissions = permissions
        self.db.commit()
        self.db.refresh(role)

        self.audit_repo.log_action(
            user_id=current_user.id,
            action="ROLE_PERMISSIONS_UPDATED",
            entity_type="role",
            entity_id=str(role_id),
            changes=f"permission_ids={permission_ids}",
        )

        return role

    def remove_permission_from_role(
        self,
        current_user: Utilisateur,
        role_id: int,
        permission_id: int,
    ) -> Role:
        self._require_super_admin(current_user)

        role = self.role_repo.get_by_id(role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rôle avec ID {role_id} non trouvé",
            )

        permission = self.perm_repo.get_by_id(permission_id)
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Permission avec ID {permission_id} non trouvée",
            )

        if permission in role.permissions:
            role.permissions.remove(permission)
            self.db.commit()
            self.db.refresh(role)

            self.audit_repo.log_action(
                user_id=current_user.id,
                action="ROLE_PERMISSION_REMOVED",
                entity_type="role",
                entity_id=str(role_id),
                changes=f"permission_id={permission_id}",
            )

        return role

    # =========================================================
    # ROLE ↔ USER
    # =========================================================

    def assign_role_to_user(
        self,
        current_user: Utilisateur,
        user_id: int,
        role_id: int,
    ) -> dict:
        self._require_super_admin(current_user)

        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Utilisateur avec ID {user_id} non trouvé",
            )

        role = self.role_repo.get_by_id(role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Rôle avec ID {role_id} non trouvé",
            )

        old_role_id = user.role_id
        user.role_id = role_id
        self.db.commit()
        self.db.refresh(user)

        self.audit_repo.log_action(
            user_id=current_user.id,
            action="USER_ROLE_ASSIGNED",
            entity_type="user",
            entity_id=str(user_id),
            changes=f"old_role_id={old_role_id}, new_role_id={role_id} ({role.code})",
        )

        return {
            "message": f"Rôle '{role.nom}' assigné à l'utilisateur '{user.nom}' avec succès",
            "user_id": user.id,
            "user_nom": user.nom,
            "role_id": role.id,
            "role_nom": role.nom,
            "role_code": role.code,
        }

    def get_user_role(
        self,
        current_user: Utilisateur,
        user_id: int,
    ) -> Role:
        # L'utilisateur peut voir son propre rôle ; Super Admin peut voir tous
        if current_user.id != user_id and (
            not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez consulter que votre propre rôle",
            )

        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Utilisateur avec ID {user_id} non trouvé",
            )

        if not user.role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aucun rôle assigné à cet utilisateur",
            )

        return user.role
