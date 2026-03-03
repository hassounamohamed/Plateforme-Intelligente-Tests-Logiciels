"""
Routes API pour la gestion des projets
"""
from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import Utilisateur
from core.rbac.dependencies import get_current_user_with_role
from core.rbac.constants import ROLE_PRODUCT_OWNER, ROLE_SUPER_ADMIN
from core.rbac.decorators import require_role
from schemas.projet import (
    CreateProjetRequest,
    UpdateProjetRequest,
    AssignerMembresRequest,
    ProjetResponse,
    ProjetStatistiquesResponse,
)
from schemas.user import MembreDisponibleResponse
from services.projet_service import ProjetService

router = APIRouter(prefix="/projets", tags=["projets"])


def get_projet_service(db: Session = Depends(get_db)) -> ProjetService:
    return ProjetService(db)


# ─── Création ─────────────────────────────────────────────────────────────────

@router.post("", response_model=ProjetResponse, status_code=status.HTTP_201_CREATED)
@require_role(ROLE_PRODUCT_OWNER)
async def creer_projet(
    data: CreateProjetRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ProjetService = Depends(get_projet_service),
):
    """Créer un nouveau projet — Product Owner uniquement."""
    return svc.creer_projet(data, current_user.id)


# ─── Lecture ──────────────────────────────────────────────────────────────────

@router.get("/mes-projets", response_model=List[ProjetResponse])
async def get_mes_projets(
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ProjetService = Depends(get_projet_service),
):
    """Projets dont l'utilisateur connecté est le Product Owner."""
    return svc.get_mes_projets(current_user.id)


@router.get("/mes-projets-membre", response_model=List[ProjetResponse])
async def get_mes_projets_membre(
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ProjetService = Depends(get_projet_service),
):
    """Projets dont l'utilisateur connecté est membre (via table association projet_membre)."""
    return svc.get_projets_membre(current_user.id)





@router.get("/membres-disponibles", response_model=List[MembreDisponibleResponse])
@require_role(ROLE_PRODUCT_OWNER)
async def get_membres_disponibles(
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ProjetService = Depends(get_projet_service),
):
    """Récupérer la liste des utilisateurs disponibles pour assignation — Product Owner uniquement."""
    return svc.get_membres_disponibles()


@router.get("/{projet_id}", response_model=ProjetResponse)
async def get_projet(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ProjetService = Depends(get_projet_service),
):
    """Récupérer un projet par son ID."""
    return svc.get_projet(projet_id)


# ─── Modification ─────────────────────────────────────────────────────────────

@router.put("/{projet_id}", response_model=ProjetResponse)
async def modifier_projet(
    projet_id: int,
    data: UpdateProjetRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ProjetService = Depends(get_projet_service),
):
    """Modifier un projet — réservé au Product Owner du projet."""
    return svc.modifier_projet(projet_id, data, current_user.id)


# ─── Archivage ────────────────────────────────────────────────────────────────

@router.patch("/{projet_id}/archiver", response_model=ProjetResponse)
async def archiver_projet(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ProjetService = Depends(get_projet_service),
):
    """Archiver un projet — réservé au Product Owner du projet."""
    return svc.archiver_projet(projet_id, current_user.id)


# ─── Membres ──────────────────────────────────────────────────────────────────

@router.post("/{projet_id}/membres", response_model=ProjetResponse)
async def assigner_membres(
    projet_id: int,
    data: AssignerMembresRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ProjetService = Depends(get_projet_service),
):
    """Assigner des membres à un projet — réservé au Product Owner du projet."""
    return svc.assigner_membres(projet_id, data, current_user.id)


# ─── Statistiques ─────────────────────────────────────────────────────────────

@router.get("/{projet_id}/statistiques", response_model=ProjetStatistiquesResponse)
async def generer_statistiques(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: ProjetService = Depends(get_projet_service),
):
    """Statistiques d'un projet (sprints, modules, statut)."""
    return svc.generer_statistiques(projet_id)
