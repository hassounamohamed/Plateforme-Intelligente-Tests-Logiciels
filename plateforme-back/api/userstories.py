"""
Routes API pour la gestion des User Stories d'un Epic
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import Utilisateur
from core.rbac.dependencies import get_current_user_with_role
from core.rbac.constants import ROLE_SCRUM_MASTER, ROLE_PRODUCT_OWNER
from core.rbac.decorators import require_role
from schemas.userstory import (
    CreateUserStoryRequest,
    UpdateUserStoryRequest,
    ChangerStatutUSRequest,
    AssignerDeveloppeurRequest,
    UserStoryResponse,
)
from services.userstory_service import UserStoryService

router = APIRouter(
    prefix="/projets/{projet_id}/modules/{module_id}/epics/{epic_id}/userstories",
    tags=["user stories"],
)


def get_us_service(db: Session = Depends(get_db)) -> UserStoryService:
    return UserStoryService(db)


# ─── Création ─────────────────────────────────────────────────────────────────

@router.post("", response_model=UserStoryResponse, status_code=status.HTTP_201_CREATED)
@require_role(ROLE_SCRUM_MASTER)
async def creer_user_story(
    projet_id: int,
    module_id: int,
    epic_id: int,
    data: CreateUserStoryRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UserStoryService = Depends(get_us_service),
):
    """
    Décomposer un epic en user story (format **En tant que / je veux / afin de**).

    - `role` : qui ? ex: « développeur »
    - `action` : quoi ? ex: « filtrer les tests par statut »
    - `benefice` : pourquoi ? ex: « identifier rapidement les anomalies »
    - `points` : story points Fibonacci (1, 2, 3, 5, 8, 13, 21)
    - `priorite` : MoSCoW — `must_have` | `should_have` | `could_have` | `wont_have`

    Scrum Master uniquement.
    """
    return svc.creer_user_story(projet_id, module_id, epic_id, data, current_user.id)


# ─── Lecture ──────────────────────────────────────────────────────────────────

@router.get("", response_model=List[UserStoryResponse])
async def get_user_stories(
    projet_id: int,
    module_id: int,
    epic_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UserStoryService = Depends(get_us_service),
    statut: Optional[str] = Query(None, description="Filtrer : to_do | in_progress | done"),
):
    """
    Lister les user stories d'un epic, triées par priorité MoSCoW.
    Filtrage optionnel par statut.
    """
    return svc.get_user_stories(projet_id, module_id, epic_id, statut)


@router.get("/backlog", response_model=List[UserStoryResponse])
async def get_backlog(
    projet_id: int,
    module_id: int,
    epic_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UserStoryService = Depends(get_us_service),
):
    """User stories non encore affectées à un sprint (backlog)."""
    return svc.get_backlog(projet_id, module_id, epic_id)


@router.get("/{us_id}", response_model=UserStoryResponse)
async def get_user_story(
    projet_id: int,
    module_id: int,
    epic_id: int,
    us_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UserStoryService = Depends(get_us_service),
):
    """Récupérer une user story par son ID."""
    return svc.get_user_story(projet_id, module_id, epic_id, us_id)


# ─── Modification ─────────────────────────────────────────────────────────────

@router.put("/{us_id}", response_model=UserStoryResponse)
@require_role(ROLE_SCRUM_MASTER)
async def modifier_user_story(
    projet_id: int,
    module_id: int,
    epic_id: int,
    us_id: int,
    data: UpdateUserStoryRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UserStoryService = Depends(get_us_service),
):
    """Modifier une user story — Scrum Master uniquement."""
    return svc.modifier_user_story(projet_id, module_id, epic_id, us_id, data, current_user.id)


# ─── Statut ───────────────────────────────────────────────────────────────────

@router.patch("/{us_id}/statut", response_model=UserStoryResponse)
@require_role(ROLE_SCRUM_MASTER)
async def changer_statut(
    projet_id: int,
    module_id: int,
    epic_id: int,
    us_id: int,
    data: ChangerStatutUSRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UserStoryService = Depends(get_us_service),
):
    """
    Faire avancer la user story : **to_do** → **in_progress** → **done**.
    Scrum Master uniquement.
    """
    return svc.changer_statut(projet_id, module_id, epic_id, us_id, data, current_user.id)


# ─── Assigner développeur ─────────────────────────────────────────────────────

@router.patch("/{us_id}/assigner", response_model=UserStoryResponse)
@require_role(ROLE_SCRUM_MASTER)
async def assigner_developpeur(
    projet_id: int,
    module_id: int,
    epic_id: int,
    us_id: int,
    data: AssignerDeveloppeurRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UserStoryService = Depends(get_us_service),
):
    """Assigner un développeur à une user story — Scrum Master uniquement."""
    return svc.assigner_developpeur(projet_id, module_id, epic_id, us_id, data, current_user.id)


# ─── Validation PO ────────────────────────────────────────────────────────────

@router.patch("/{us_id}/valider", response_model=UserStoryResponse)
@require_role(ROLE_PRODUCT_OWNER)
async def valider_user_story(
    projet_id: int,
    module_id: int,
    epic_id: int,
    us_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UserStoryService = Depends(get_us_service),
):
    """
    Valider une user story (passage forcé à **done**) — Product Owner uniquement.
    """
    return svc.valider_user_story(projet_id, module_id, epic_id, us_id, current_user.id)


# ─── Suppression ──────────────────────────────────────────────────────────────

@router.delete("/{us_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_role(ROLE_SCRUM_MASTER)
async def supprimer_user_story(
    projet_id: int,
    module_id: int,
    epic_id: int,
    us_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UserStoryService = Depends(get_us_service),
):
    """Supprimer une user story — Scrum Master uniquement."""
    svc.supprimer_user_story(projet_id, module_id, epic_id, us_id, current_user.id)
