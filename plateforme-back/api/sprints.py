"""
Routes API pour la gestion des sprints d'un projet
"""
from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import Utilisateur
from core.rbac.dependencies import get_current_user_with_role
from core.rbac.constants import ROLE_SCRUM_MASTER
from core.rbac.decorators import require_role
from schemas.sprint import (
    CreateSprintRequest,
    UpdateSprintRequest,
    AjouterUserStoriesRequest,
    RetirerUserStoriesRequest,
    SprintResponse,
    SprintVelociteResponse,
)
from services.sprint_service import SprintService

router = APIRouter(prefix="/projets/{projet_id}/sprints", tags=["sprints"])


def get_sprint_service(db: Session = Depends(get_db)) -> SprintService:
    return SprintService(db)


# ─── Création ─────────────────────────────────────────────────────────────────

@router.post("", response_model=SprintResponse, status_code=status.HTTP_201_CREATED)
@require_role(ROLE_SCRUM_MASTER)
async def creer_sprint(
    projet_id: int,
    data: CreateSprintRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: SprintService = Depends(get_sprint_service),
):
    """
    Créer un sprint planifié pour un projet.

    - `nom` : ex. « Sprint 1 »
    - `dateDebut` / `dateFin` : durée du sprint (dateFin doit être > dateDebut)
    - `capaciteEquipe` : nombre de story points que l'équipe peut absorber
    - `objectifSprint` : but du sprint

    Scrum Master uniquement.
    """
    return svc.creer_sprint(projet_id, data, current_user.id)


# ─── Lecture ──────────────────────────────────────────────────────────────────

@router.get("", response_model=List[SprintResponse])
async def get_sprints(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: SprintService = Depends(get_sprint_service),
):
    """Lister tous les sprints d'un projet dans l'ordre chronologique."""
    return svc.get_sprints(projet_id)


@router.get("/actif", response_model=SprintResponse | None)
async def get_sprint_actif(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: SprintService = Depends(get_sprint_service),
):
    """Récupérer le sprint actuellement en cours pour le projet (ou null si aucun)."""
    return svc.get_sprint_actif(projet_id)


@router.get("/{sprint_id}", response_model=SprintResponse)
async def get_sprint(
    projet_id: int,
    sprint_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: SprintService = Depends(get_sprint_service),
):
    """Récupérer un sprint avec la liste de ses user stories."""
    # Accepter n'importe quel projet_id et retourner le bon sprint
    return svc.get_sprint_flexible(projet_id, sprint_id)


# ─── Modification ─────────────────────────────────────────────────────────────

@router.put("/{sprint_id}", response_model=SprintResponse)
@require_role(ROLE_SCRUM_MASTER)
async def modifier_sprint(
    projet_id: int,
    sprint_id: int,
    data: UpdateSprintRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: SprintService = Depends(get_sprint_service),
):
    """Modifier les paramètres d'un sprint (planifié ou en cours) — Scrum Master."""
    return svc.modifier_sprint_flexible(projet_id, sprint_id, data, current_user.id)


# ─── Cycle de vie ─────────────────────────────────────────────────────────────

@router.patch("/{sprint_id}/demarrer", response_model=SprintResponse)
@require_role(ROLE_SCRUM_MASTER)
async def demarrer_sprint(
    projet_id: int,
    sprint_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: SprintService = Depends(get_sprint_service),
):
    """
    Démarrer un sprint planifié → statut **en_cours**.
    Un seul sprint peut être actif à la fois par projet.
    """
    return svc.demarrer_sprint_flexible(projet_id, sprint_id, current_user.id)


@router.patch("/{sprint_id}/cloturer", response_model=SprintResponse)
@require_role(ROLE_SCRUM_MASTER)
async def cloturer_sprint(
    projet_id: int,
    sprint_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: SprintService = Depends(get_sprint_service),
):
    """
    Clôturer le sprint en cours → statut **termine**.
    La vélocité est calculée automatiquement à la clôture.
    """
    return svc.cloturer_sprint_flexible(projet_id, sprint_id, current_user.id)


# ─── User Stories ─────────────────────────────────────────────────────────────

@router.post("/{sprint_id}/userstories", response_model=SprintResponse)
@require_role(ROLE_SCRUM_MASTER)
async def ajouter_userstories(
    projet_id: int,
    sprint_id: int,
    data: AjouterUserStoriesRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: SprintService = Depends(get_sprint_service),
):
    """Ajouter des user stories au sprint — Scrum Master uniquement."""
    return svc.ajouter_userstories_flexible(projet_id, sprint_id, data, current_user.id)


@router.delete("/{sprint_id}/userstories", response_model=SprintResponse)
@require_role(ROLE_SCRUM_MASTER)
async def retirer_userstories(
    projet_id: int,
    sprint_id: int,
    data: RetirerUserStoriesRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: SprintService = Depends(get_sprint_service),
):
    """Retirer des user stories du sprint — Scrum Master uniquement."""
    return svc.retirer_userstories_flexible(projet_id, sprint_id, data, current_user.id)


# ─── Vélocité ─────────────────────────────────────────────────────────────────

@router.get("/{sprint_id}/velocite", response_model=SprintVelociteResponse)
async def calculer_velocite(
    projet_id: int,
    sprint_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: SprintService = Depends(get_sprint_service),
):
    """
    Calculer la vélocité du sprint :
    somme des story points des user stories au statut **done**.
    """
    return svc.calculer_velocite_flexible(projet_id, sprint_id)


# ─── Suppression ──────────────────────────────────────────────────────────────

@router.delete("/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_role(ROLE_SCRUM_MASTER)
async def supprimer_sprint(
    projet_id: int,
    sprint_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: SprintService = Depends(get_sprint_service),
):
    """Supprimer un sprint (uniquement si statut 'planifie') — Scrum Master."""
    svc.supprimer_sprint_flexible(projet_id, sprint_id, current_user.id)
