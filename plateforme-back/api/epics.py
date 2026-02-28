"""
Routes API pour la gestion des epics d'un module
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import Utilisateur
from core.rbac.dependencies import get_current_user_with_role
from core.rbac.constants import ROLE_PRODUCT_OWNER
from core.rbac.decorators import require_role
from schemas.epic import (
    CreateEpicRequest,
    UpdateEpicRequest,
    ChangerStatutRequest,
    ChangerPrioriteRequest,
    EpicResponse,
    EpicHierarchieResponse,
    EpicProgressionResponse,
)
from services.epic_service import EpicService

router = APIRouter(
    prefix="/projets/{projet_id}/modules/{module_id}/epics",
    tags=["epics"],
)


def get_epic_service(db: Session = Depends(get_db)) -> EpicService:
    return EpicService(db)


# ─── Création ─────────────────────────────────────────────────────────────────

@router.post("", response_model=EpicResponse, status_code=status.HTTP_201_CREATED)
@require_role(ROLE_PRODUCT_OWNER)
async def creer_epic(
    projet_id: int,
    module_id: int,
    data: CreateEpicRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: EpicService = Depends(get_epic_service),
):
    """Créer un epic dans un module — Product Owner uniquement."""
    return svc.creer_epic(projet_id, module_id, data, current_user.id)


# ─── Lecture ──────────────────────────────────────────────────────────────────

@router.get("", response_model=List[EpicHierarchieResponse])
async def get_epics(
    projet_id: int,
    module_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: EpicService = Depends(get_epic_service),
    statut: Optional[str] = Query(
        None,
        description="Filtrer par statut : to_do | in_progress | done",
    ),
):
    """
    Lister les epics d'un module triés par priorité décroissante.
    Filtrage optionnel par statut (to_do / in_progress / done).
    """
    return svc.get_epics(projet_id, module_id, statut)


@router.get("/{epic_id}", response_model=EpicHierarchieResponse)
async def get_epic(
    projet_id: int,
    module_id: int,
    epic_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: EpicService = Depends(get_epic_service),
):
    """Récupérer un epic avec ses user-stories."""
    return svc.get_epic(projet_id, module_id, epic_id)


@router.get("/{epic_id}/progression", response_model=EpicProgressionResponse)
async def get_progression(
    projet_id: int,
    module_id: int,
    epic_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: EpicService = Depends(get_epic_service),
):
    """Calculer la progression d'un epic (% user-stories terminées)."""
    return svc.get_progression(projet_id, module_id, epic_id)


# ─── Modification ─────────────────────────────────────────────────────────────

@router.put("/{epic_id}", response_model=EpicResponse)
@require_role(ROLE_PRODUCT_OWNER)
async def modifier_epic(
    projet_id: int,
    module_id: int,
    epic_id: int,
    data: UpdateEpicRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: EpicService = Depends(get_epic_service),
):
    """Modifier un epic — Product Owner uniquement."""
    return svc.modifier_epic(projet_id, module_id, epic_id, data, current_user.id)


# ─── Statut ───────────────────────────────────────────────────────────────────

@router.patch("/{epic_id}/statut", response_model=EpicResponse)
@require_role(ROLE_PRODUCT_OWNER)
async def changer_statut(
    projet_id: int,
    module_id: int,
    epic_id: int,
    data: ChangerStatutRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: EpicService = Depends(get_epic_service),
):
    """
    Changer le statut d'un epic.
    Valeurs : **to_do** → **in_progress** → **done**
    """
    return svc.changer_statut(projet_id, module_id, epic_id, data, current_user.id)


# ─── Priorisation ─────────────────────────────────────────────────────────────

@router.patch("/{epic_id}/priorite", response_model=EpicResponse)
@require_role(ROLE_PRODUCT_OWNER)
async def changer_priorite(
    projet_id: int,
    module_id: int,
    epic_id: int,
    data: ChangerPrioriteRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: EpicService = Depends(get_epic_service),
):
    """Mettre à jour la priorité d'un epic (entier ≥ 0, plus élevé = plus prioritaire)."""
    return svc.changer_priorite(projet_id, module_id, epic_id, data, current_user.id)


# ─── Suppression ──────────────────────────────────────────────────────────────

@router.delete("/{epic_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_role(ROLE_PRODUCT_OWNER)
async def supprimer_epic(
    projet_id: int,
    module_id: int,
    epic_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: EpicService = Depends(get_epic_service),
):
    """Supprimer un epic et ses user-stories en cascade — Product Owner uniquement."""
    svc.supprimer_epic(projet_id, module_id, epic_id, current_user.id)
