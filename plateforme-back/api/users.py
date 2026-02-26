from typing import Annotated, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from starlette import status

from db.database import get_db
from models.user import Utilisateur
from core.rbac.dependencies import get_current_user, get_current_user_with_role
from core.rbac.constants import ROLE_SUPER_ADMIN
from core.rbac.decorators import require_role
from schemas.user import UpdatePasswordRequest, UpdateProfileRequest, UserAdminResponse
from services.auth_service import AuthService

router = APIRouter(prefix="/users", tags=["users"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


# =============================================================
# SUPER ADMIN — Gestion des utilisateurs
# =============================================================

@router.get("", response_model=List[UserAdminResponse])
@require_role(ROLE_SUPER_ADMIN)
async def get_all_users(
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AuthService = Depends(get_auth_service),
):
    """Liste tous les utilisateurs (actifs et inactifs) — Super Admin uniquement."""
    return svc.get_all_users()


@router.get("/pending", response_model=List[UserAdminResponse])
@require_role(ROLE_SUPER_ADMIN)
async def get_pending_users(
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AuthService = Depends(get_auth_service),
):
    """Liste les comptes en attente d'activation — Super Admin uniquement."""
    return svc.get_pending_users()


@router.patch("/{user_id}/activate", status_code=status.HTTP_200_OK)
@require_role(ROLE_SUPER_ADMIN)
async def activate_user(
    user_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AuthService = Depends(get_auth_service),
):
    """Active le compte d'un utilisateur — Super Admin uniquement."""
    return svc.activate_user(user_id)


@router.patch("/{user_id}/deactivate", status_code=status.HTTP_200_OK)
@require_role(ROLE_SUPER_ADMIN)
async def deactivate_user(
    user_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AuthService = Depends(get_auth_service),
):
    """Désactive le compte d'un utilisateur — Super Admin uniquement."""
    return svc.deactivate_user(user_id)


# =============================================================
# UTILISATEUR CONNECTÉ — Profil & Mot de passe
# =============================================================

@router.patch("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    request: UpdatePasswordRequest,
    user_id: Annotated[int, Depends(get_current_user)],
    svc: AuthService = Depends(get_auth_service),
):
    """Changer son propre mot de passe."""
    return svc.change_password(user_id, request.ancien_mot_de_passe, request.nouveau_mot_de_passe)


@router.patch("/me/profile", status_code=status.HTTP_200_OK)
async def update_profile(
    request: UpdateProfileRequest,
    user_id: Annotated[int, Depends(get_current_user)],
    svc: AuthService = Depends(get_auth_service),
):
    """Mettre à jour son propre profil (nom, téléphone)."""
    return svc.update_profile(user_id, nom=request.nom, telephone=request.telephone)
