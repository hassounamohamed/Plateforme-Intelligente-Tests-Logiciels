from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette import status

from db.database import get_db
from models.user import Utilisateur, Role, Permission
from core.rbac import (
    get_current_user_with_role,
    check_user_has_permission,
    ROLE_SUPER_ADMIN
)
from schemas.permission import PermissionResponse
from schemas.role import (
    RoleResponse,
    CreateRoleRequest,
    UpdateRoleRequest,
    AssignPermissionsRequest,
    AssignRoleToUserRequest
)

router = APIRouter(
    prefix="/roles",
    tags=["roles"]
)

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[Utilisateur, Depends(get_current_user_with_role)]


# ================= PERMISSIONS MANAGEMENT =================
@router.get("/permissions", response_model=List[PermissionResponse])
async def get_all_permissions(
    db: db_dependency,
    current_user: user_dependency
):
    """Récupérer toutes les permissions (Super Admin uniquement)"""
    # Vérifier que l'utilisateur est Super Admin
    if not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le Super Admin peut consulter les permissions"
        )
    
    permissions = db.query(Permission).all()
    return permissions


@router.post("/permissions", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    db: db_dependency,
    current_user: user_dependency,
    nom: str,
    resource: str,
    action: str,
    description: str | None = None
):
    """Créer une nouvelle permission (Super Admin uniquement)"""
    # Vérifier que l'utilisateur est Super Admin
    if not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le Super Admin peut créer des permissions"
        )
    
    # Vérifier si la permission existe déjà
    existing = db.query(Permission).filter(
        Permission.resource == resource,
        Permission.action == action
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permission {action} sur {resource} existe déjà"
        )
    
    new_permission = Permission(
        nom=nom,
        resource=resource,
        action=action,
        description=description
    )
    
    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)
    
    return new_permission


# ================= ROLES CRUD =================
@router.get("", response_model=List[RoleResponse])
async def get_all_roles(
    db: db_dependency,
    current_user: user_dependency
):
    """Récupérer tous les rôles avec leurs permissions (Super Admin uniquement)"""
    # Vérifier que l'utilisateur est Super Admin
    if not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le Super Admin peut consulter tous les rôles"
        )
    
    roles = db.query(Role).all()
    return roles


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role_by_id(
    role_id: int,
    db: db_dependency,
    current_user: user_dependency
):
    """Récupérer un rôle spécifique par ID (Super Admin uniquement)"""
    # Vérifier que l'utilisateur est Super Admin
    if not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le Super Admin peut consulter les détails des rôles"
        )
    
    role = db.query(Role).filter(Role.id == role_id).first()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rôle avec ID {role_id} non trouvé"
        )
    
    return role


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    request: CreateRoleRequest,
    db: db_dependency,
    current_user: user_dependency
):
    """Créer un nouveau rôle (Super Admin uniquement)"""
    # Vérifier que l'utilisateur est Super Admin
    if not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le Super Admin peut créer des rôles"
        )
    
    # Vérifier si le code existe déjà
    existing = db.query(Role).filter(Role.code == request.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le code de rôle '{request.code}' existe déjà"
        )
    
    new_role = Role(
        nom=request.nom,
        code=request.code,
        description=request.description,
        niveau_acces=request.niveau_acces
    )
    
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    
    return new_role


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    request: UpdateRoleRequest,
    db: db_dependency,
    current_user: user_dependency
):
    """Mettre à jour un rôle (Super Admin uniquement)"""
    # Vérifier que l'utilisateur est Super Admin
    if not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le Super Admin peut modifier des rôles"
        )
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rôle avec ID {role_id} non trouvé"
        )
    
    # Mise à jour des champs
    if request.nom is not None:
        role.nom = request.nom
    if request.description is not None:
        role.description = request.description
    if request.niveau_acces is not None:
        role.niveau_acces = request.niveau_acces
    
    db.commit()
    db.refresh(role)
    
    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    db: db_dependency,
    current_user: user_dependency
):
    """Supprimer un rôle (Super Admin uniquement)"""
    # Vérifier que l'utilisateur est Super Admin
    if not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le Super Admin peut supprimer des rôles"
        )
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rôle avec ID {role_id} non trouvé"
        )
    
    # Vérifier qu'aucun utilisateur n'a ce rôle
    users_with_role = db.query(Utilisateur).filter(Utilisateur.role_id == role_id).count()
    if users_with_role > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de supprimer: {users_with_role} utilisateur(s) ont ce rôle"
        )
    
    db.delete(role)
    db.commit()
    
    return None


# ================= ASSIGN PERMISSIONS TO ROLE =================
@router.post("/{role_id}/permissions", response_model=RoleResponse)
async def assign_permissions_to_role(
    role_id: int,
    request: AssignPermissionsRequest,
    db: db_dependency,
    current_user: user_dependency
):
    """Assigner des permissions à un rôle (Super Admin uniquement)"""
    # Vérifier que l'utilisateur est Super Admin
    if not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le Super Admin peut assigner des permissions"
        )
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rôle avec ID {role_id} non trouvé"
        )
    
    # Récupérer les permissions
    permissions = db.query(Permission).filter(Permission.id.in_(request.permission_ids)).all()
    
    if len(permissions) != len(request.permission_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Certaines permissions spécifiées n'existent pas"
        )
    
    # Remplacer les permissions existantes
    role.permissions = permissions
    
    db.commit()
    db.refresh(role)
    
    return role


@router.delete("/{role_id}/permissions/{permission_id}", response_model=RoleResponse)
async def remove_permission_from_role(
    role_id: int,
    permission_id: int,
    db: db_dependency,
    current_user: user_dependency
):
    """Retirer une permission d'un rôle (Super Admin uniquement)"""
    # Vérifier que l'utilisateur est Super Admin
    if not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le Super Admin peut retirer des permissions"
        )
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rôle avec ID {role_id} non trouvé"
        )
    
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission avec ID {permission_id} non trouvée"
        )
    
    if permission in role.permissions:
        role.permissions.remove(permission)
        db.commit()
        db.refresh(role)
    
    return role


# ================= ASSIGN ROLE TO USER =================
@router.post("/assign-user", status_code=status.HTTP_200_OK)
async def assign_role_to_user(
    request: AssignRoleToUserRequest,
    db: db_dependency,
    current_user: user_dependency
):
    """Assigner un rôle à un utilisateur (Super Admin uniquement)"""
    # Vérifier que l'utilisateur est Super Admin
    if not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le Super Admin peut assigner des rôles"
        )
    
    # Vérifier que l'utilisateur existe
    user = db.query(Utilisateur).filter(Utilisateur.id == request.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur avec ID {request.user_id} non trouvé"
        )
    
    # Vérifier que le rôle existe
    role = db.query(Role).filter(Role.id == request.role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rôle avec ID {request.role_id} non trouvé"
        )
    
    # Assigner le rôle
    user.role_id = request.role_id
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"Rôle '{role.nom}' assigné à l'utilisateur '{user.nom}' avec succès",
        "user_id": user.id,
        "user_nom": user.nom,
        "role_id": role.id,
        "role_nom": role.nom,
        "role_code": role.code
    }


@router.get("/user/{user_id}/role", response_model=RoleResponse)
async def get_user_role(
    user_id: int,
    db: db_dependency,
    current_user: user_dependency
):
    """Récupérer le rôle d'un utilisateur spécifique"""
    # L'utilisateur peut voir son propre rôle ou Super Admin peut voir tous les rôles
    if current_user.id != user_id and (not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez consulter que votre propre rôle"
        )
    
    user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur avec ID {user_id} non trouvé"
        )
    
    if not user.role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun rôle assigné à cet utilisateur"
        )
    
    return user.role
