from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette import status

from db.database import get_db
from models.user import Utilisateur
from core.rbac.dependencies import get_current_user, get_current_user_with_role
from core.rbac.constants import ROLE_SUPER_ADMIN
from core.rbac.decorators import require_role
from schemas.user import UpdatePasswordRequest, UpdateProfileRequest, UserAdminResponse
from schemas.api_key import (
    APIKeyCreateRequest,
    APIKeyStatusResponse,
    APIKeyToggleRequest,
    APIKeyDeleteResponse,
    APIKeyQuotaResponse,
)
from services.auth_service import AuthService
from services.api_key_service import APIKeyService

router = APIRouter(prefix="/users", tags=["users"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_api_key_service(db: Session = Depends(get_db)) -> APIKeyService:
    return APIKeyService(db)


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


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
@require_role(ROLE_SUPER_ADMIN)
async def delete_user(
    user_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AuthService = Depends(get_auth_service),
):
    """Supprime définitivement un utilisateur — Super Admin uniquement."""
    return svc.delete_user(user_id)


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


# =============================================================
# API KEY MANAGEMENT — Custom AI API Key
# =============================================================

@router.post("/me/api-key", response_model=APIKeyStatusResponse, status_code=status.HTTP_201_CREATED)
async def save_api_key(
    request: APIKeyCreateRequest,
    user_id: Annotated[int, Depends(get_current_user)],
    svc: APIKeyService = Depends(get_api_key_service),
):
    """
    Save or update user's custom API key for AI services.
    
    The API key is encrypted before storage and never exposed in responses.
    User will see only a masked version (last 4 characters).
    """
    return svc.save_api_key(user_id, request.api_key, request.provider)


@router.get("/me/api-key/status", response_model=APIKeyStatusResponse)
async def get_api_key_status(
    user_id: Annotated[int, Depends(get_current_user)],
    svc: APIKeyService = Depends(get_api_key_service),
):
    """
    Get current API key status for the user.
    
    Returns:
    - Whether user has a custom API key
    - Whether they're using it (vs platform key)
    - Masked key (last 4 chars only for security)
    - Creation and last used timestamps
    """
    return svc.get_api_key_status(user_id)


@router.patch("/me/api-key/toggle", response_model=APIKeyStatusResponse)
async def toggle_api_key(
    request: APIKeyToggleRequest,
    user_id: Annotated[int, Depends(get_current_user)],
    svc: APIKeyService = Depends(get_api_key_service),
):
    """
    Toggle between using custom API key and platform key.
    
    Requires user to have already added a custom API key.
    """
    return svc.toggle_api_key(user_id, request.use_custom_api_key)


@router.delete("/me/api-key", response_model=APIKeyDeleteResponse)
async def delete_api_key(
    user_id: Annotated[int, Depends(get_current_user)],
    svc: APIKeyService = Depends(get_api_key_service),
):
    """
    Delete user's custom API key.
    
    After deletion, platform key will be used for all AI requests.
    """
    return svc.delete_api_key(user_id)


@router.get("/me/api-key/quota", response_model=APIKeyQuotaResponse)
async def get_api_key_quota(
    user_id: Annotated[int, Depends(get_current_user)],
    svc: APIKeyService = Depends(get_api_key_service),
):
    """
    Get user's API usage quota status.
    
    Shows:
    - Free quota limit per month
    - Current usage
    - Remaining quota
    - Whether quota is exhausted
    - Alert if custom API key is needed
    """
    return svc.get_api_key_quota(user_id)
