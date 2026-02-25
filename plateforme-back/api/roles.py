from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import Utilisateur
from core.rbac import get_current_user_with_role
from schemas.permission import PermissionResponse
from schemas.role import (
    RoleResponse,
    CreateRoleRequest,
    UpdateRoleRequest,
    AssignPermissionsRequest,
    AssignRoleToUserRequest,
)
from services.roles_service import RolesService

router = APIRouter(
    prefix="/roles",
    tags=["roles"],
)

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[Utilisateur, Depends(get_current_user_with_role)]


def get_roles_service(db: Session = Depends(get_db)) -> RolesService:
    return RolesService(db)


# ================= PERMISSIONS MANAGEMENT =================
@router.get("/permissions", response_model=List[PermissionResponse])
async def get_all_permissions(
    current_user: user_dependency,
    svc: RolesService = Depends(get_roles_service),
):
    """Récupérer toutes les permissions (Super Admin uniquement)"""
    return svc.get_all_permissions(current_user)


@router.post("/permissions", response_model=PermissionResponse, status_code=201)
async def create_permission(
    current_user: user_dependency,
    nom: str,
    resource: str,
    action: str,
    description: Optional[str] = None,
    svc: RolesService = Depends(get_roles_service),
):
    """Créer une nouvelle permission (Super Admin uniquement)"""
    return svc.create_permission(current_user, nom, resource, action, description)


# ================= ROLES CRUD =================
@router.get("", response_model=List[RoleResponse])
async def get_all_roles(
    current_user: user_dependency,
    svc: RolesService = Depends(get_roles_service),
):
    """Récupérer tous les rôles avec leurs permissions (Super Admin uniquement)"""
    return svc.get_all_roles(current_user)


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role_by_id(
    role_id: int,
    current_user: user_dependency,
    svc: RolesService = Depends(get_roles_service),
):
    """Récupérer un rôle spécifique par ID (Super Admin uniquement)"""
    return svc.get_role_by_id(current_user, role_id)


@router.post("", response_model=RoleResponse, status_code=201)
async def create_role(
    request: CreateRoleRequest,
    current_user: user_dependency,
    svc: RolesService = Depends(get_roles_service),
):
    """Créer un nouveau rôle (Super Admin uniquement)"""
    return svc.create_role(
        current_user,
        nom=request.nom,
        code=request.code,
        description=request.description,
        niveau_acces=request.niveau_acces,
    )


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    request: UpdateRoleRequest,
    current_user: user_dependency,
    svc: RolesService = Depends(get_roles_service),
):
    """Mettre à jour un rôle (Super Admin uniquement)"""
    return svc.update_role(
        current_user,
        role_id=role_id,
        nom=request.nom,
        description=request.description,
        niveau_acces=request.niveau_acces,
    )


@router.delete("/{role_id}", status_code=204)
async def delete_role(
    role_id: int,
    current_user: user_dependency,
    svc: RolesService = Depends(get_roles_service),
):
    """Supprimer un rôle (Super Admin uniquement)"""
    svc.delete_role(current_user, role_id)
    return None


# ================= ASSIGN PERMISSIONS TO ROLE =================
@router.post("/{role_id}/permissions", response_model=RoleResponse)
async def assign_permissions_to_role(
    role_id: int,
    request: AssignPermissionsRequest,
    current_user: user_dependency,
    svc: RolesService = Depends(get_roles_service),
):
    """Assigner des permissions à un rôle (Super Admin uniquement)"""
    return svc.assign_permissions_to_role(current_user, role_id, request.permission_ids)


@router.delete("/{role_id}/permissions/{permission_id}", response_model=RoleResponse)
async def remove_permission_from_role(
    role_id: int,
    permission_id: int,
    current_user: user_dependency,
    svc: RolesService = Depends(get_roles_service),
):
    """Retirer une permission d'un rôle (Super Admin uniquement)"""
    return svc.remove_permission_from_role(current_user, role_id, permission_id)


# ================= ASSIGN ROLE TO USER =================
@router.post("/assign-user", status_code=200)
async def assign_role_to_user(
    request: AssignRoleToUserRequest,
    current_user: user_dependency,
    svc: RolesService = Depends(get_roles_service),
):
    """Assigner un rôle à un utilisateur (Super Admin uniquement)"""
    return svc.assign_role_to_user(current_user, request.user_id, request.role_id)


@router.get("/user/{user_id}/role", response_model=RoleResponse)
async def get_user_role(
    user_id: int,
    current_user: user_dependency,
    svc: RolesService = Depends(get_roles_service),
):
    """Récupérer le rôle d'un utilisateur spécifique"""
    return svc.get_user_role(current_user, user_id)
