"""
Routes API pour la génération IA du backlog Scrum.

Endpoints :
  POST   /projets/{projet_id}/ai/generate           Lancer une génération
  GET    /projets/{projet_id}/ai/generations         Lister les générations
  GET    /projets/{projet_id}/ai/generations/{id}    Détail + logs + items
  GET    /projets/{projet_id}/ai/generations/{id}/items  Items hiérarchiques
  PATCH  /projets/{projet_id}/ai/generations/{id}/items/{item_id}         Modifier un item
  PATCH  /projets/{projet_id}/ai/generations/{id}/items/{item_id}/status  Changer statut
"""
from typing import Annotated, List

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from core.rbac.constants import ROLE_PRODUCT_OWNER
from core.rbac.decorators import require_role
from core.rbac.dependencies import get_current_user_with_role
from db.database import get_db
from models.user import Utilisateur
from schemas.ai_generation import (
    AIGeneratedItemResponse,
    AIGenerationDetailResponse,
    AIGenerationResponse,
    StartGenerationRequest,
    UpdateItemRequest,
    UpdateItemStatusRequest,
)
from services.ai_generation_service import AIGenerationService

router = APIRouter(
    prefix="/projets/{projet_id}/ai",
    tags=["ai-generation"],
)


def get_ai_service(db: Session = Depends(get_db)) -> AIGenerationService:
    return AIGenerationService(db)


# ─── Démarrer une génération ──────────────────────────────────────────────────

@router.post(
    "/generate",
    response_model=AIGenerationResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Lancer la génération IA du backlog Scrum à partir du cahier des charges",
)
@require_role(ROLE_PRODUCT_OWNER)
async def lancer_generation(
    projet_id: int,
    background_tasks: BackgroundTasks,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    body: StartGenerationRequest = StartGenerationRequest(),
    svc: AIGenerationService = Depends(get_ai_service),
):
    """
    Lance une génération IA asynchrone.
    Retourne immédiatement l'objet AIGeneration (status=pending).
    Interroger GET /generations/{id} pour suivre la progression.
    """
    gen = svc.demarrer_generation(projet_id, current_user.id)
    background_tasks.add_task(svc.executer_generation, gen.id)
    return gen


# ─── Lister les générations d'un projet ──────────────────────────────────────

@router.get(
    "/generations",
    response_model=List[AIGenerationResponse],
    summary="Lister toutes les générations IA pour un projet",
)
async def lister_generations(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AIGenerationService = Depends(get_ai_service),
):
    return svc.lister_par_projet(projet_id)


# ─── Détail d'une génération (avec logs et items) ────────────────────────────

@router.get(
    "/generations/{generation_id}",
    response_model=AIGenerationDetailResponse,
    summary="Détail d'une génération avec logs et items générés",
)
async def detail_generation(
    projet_id: int,
    generation_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AIGenerationService = Depends(get_ai_service),
):
    return svc.obtenir_detail(generation_id)


# ─── Items hiérarchiques ───────────────────────────────────────────────────────

@router.get(
    "/generations/{generation_id}/items",
    response_model=List[AIGeneratedItemResponse],
    summary="Items générés structurés en arbre (Modules → Epics → User Stories)",
)
async def items_hierarchiques(
    projet_id: int,
    generation_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AIGenerationService = Depends(get_ai_service),
):
    return svc.obtenir_items_hierarchiques(generation_id)


# ─── Modifier un item ─────────────────────────────────────────────────────────

@router.patch(
    "/generations/{generation_id}/items/{item_id}",
    response_model=AIGeneratedItemResponse,
    summary="Modifier manuellement un item généré (titre, description, critères, priorité, points)",
)
@require_role(ROLE_PRODUCT_OWNER)
async def modifier_item(
    projet_id: int,
    generation_id: int,
    item_id: int,
    body: UpdateItemRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AIGenerationService = Depends(get_ai_service),
):
    return svc.modifier_item(
        generation_id,
        item_id,
        **{k: v for k, v in body.model_dump(exclude_none=True).items()},
    )


# ─── Changer le statut d'un item ──────────────────────────────────────────────

@router.patch(
    "/generations/{generation_id}/items/{item_id}/status",
    response_model=AIGeneratedItemResponse,
    summary="Approuver, rejeter ou marquer comme modifié un item généré",
)
@require_role(ROLE_PRODUCT_OWNER)
async def changer_statut_item(
    projet_id: int,
    generation_id: int,
    item_id: int,
    body: UpdateItemStatusRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AIGenerationService = Depends(get_ai_service),
):
    return svc.changer_statut_item(generation_id, item_id, body.status)
