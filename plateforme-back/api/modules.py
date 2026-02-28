"""
Routes API pour la gestion des modules d'un projet
"""
from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import Utilisateur
from core.rbac.dependencies import get_current_user_with_role
from core.rbac.constants import ROLE_PRODUCT_OWNER
from core.rbac.decorators import require_role
from schemas.module import (
    CreateModuleRequest,
    UpdateModuleRequest,
    ReordonnerModulesRequest,
    ModuleResponse,
    ModuleHierarchieResponse,
)
from services.module_service import ModuleService

router = APIRouter(prefix="/projets/{projet_id}/modules", tags=["modules"])


def get_module_service(db: Session = Depends(get_db)) -> ModuleService:
    return ModuleService(db)


# ─── Création ─────────────────────────────────────────────────────────────────

@router.post("", response_model=ModuleResponse, status_code=status.HTTP_201_CREATED)
@require_role(ROLE_PRODUCT_OWNER)
async def creer_module(
    projet_id: int,
    data: CreateModuleRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ModuleService = Depends(get_module_service),
):
    """Créer un module dans un projet — Product Owner uniquement."""
    return svc.creer_module(projet_id, data, current_user.id)


# ─── Lecture ──────────────────────────────────────────────────────────────────

@router.get("", response_model=List[ModuleHierarchieResponse])
async def get_modules(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ModuleService = Depends(get_module_service),
):
    """
    Lister tous les modules du projet ordonnés, avec la hiérarchie des epics.
    Accessible à tous les membres authentifiés.
    """
    return svc.get_modules_avec_hierarchie(projet_id)


@router.get("/{module_id}", response_model=ModuleHierarchieResponse)
async def get_module(
    projet_id: int,
    module_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ModuleService = Depends(get_module_service),
):
    """Récupérer un module avec ses epics."""
    return svc.get_module(projet_id, module_id)


# ─── Modification ─────────────────────────────────────────────────────────────

@router.put("/{module_id}", response_model=ModuleResponse)
@require_role(ROLE_PRODUCT_OWNER)
async def modifier_module(
    projet_id: int,
    module_id: int,
    data: UpdateModuleRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ModuleService = Depends(get_module_service),
):
    """Modifier un module — Product Owner du projet uniquement."""
    return svc.modifier_module(projet_id, module_id, data, current_user.id)


# ─── Réordonnancement ─────────────────────────────────────────────────────────

@router.patch("/reordonner", response_model=List[ModuleResponse])
@require_role(ROLE_PRODUCT_OWNER)
async def reordonner_modules(
    projet_id: int,
    data: ReordonnerModulesRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ModuleService = Depends(get_module_service),
):
    """
    Redéfinir l'ordre des modules en fournissant la liste des IDs
    dans le nouvel ordre souhaité — Product Owner uniquement.
    """
    return svc.reordonner_modules(projet_id, data, current_user.id)


# ─── Suppression ──────────────────────────────────────────────────────────────

@router.delete("/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_role(ROLE_PRODUCT_OWNER)
async def supprimer_module(
    projet_id: int,
    module_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ModuleService = Depends(get_module_service),
):
    """Supprimer un module et ses epics en cascade — Product Owner uniquement."""
    svc.supprimer_module(projet_id, module_id, current_user.id)
