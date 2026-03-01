"""
Routes API pour la visualisation et gestion du backlog projet
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import Utilisateur
from core.rbac.dependencies import get_current_user_with_role
from core.rbac.constants import ROLE_SCRUM_MASTER
from core.rbac.decorators import require_role
from schemas.backlog import (
    ReordonnerBacklogRequest,
    BacklogItemResponse,
    BacklogIndicateursResponse,
)
from services.backlog_service import BacklogService

router = APIRouter(prefix="/projets/{projet_id}/backlog", tags=["backlog"])


def get_backlog_service(db: Session = Depends(get_db)) -> BacklogService:
    return BacklogService(db)


# ─── Vue backlog complète ──────────────────────────────────────────────────────

@router.get("", response_model=List[BacklogItemResponse])
async def get_backlog(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: BacklogService = Depends(get_backlog_service),
    epic_id: Optional[int] = Query(None, description="Filtrer par epic"),
    statut: Optional[str] = Query(None, description="to_do | in_progress | done"),
    priorite: Optional[str] = Query(None, description="must_have | should_have | could_have | wont_have"),
    non_planifiees: bool = Query(False, description="True = uniquement les stories sans sprint"),
    tri: str = Query("priorite", description="priorite | points | ordre | statut"),
):
    """
    Vue backlog du projet — toutes les user stories de tous les epics/modules.

    **Filtres disponibles :**
    - `epic_id` — limiter à un epic
    - `statut` — `to_do` / `in_progress` / `done`
    - `priorite` — MoSCoW : `must_have` / `should_have` / `could_have` / `wont_have`
    - `non_planifiees` — uniquement les stories non affectées à un sprint

    **Tri disponible :** `priorite` (MoSCoW, par défaut) | `points` | `ordre` | `statut`
    """
    return svc.get_backlog(
        projet_id=projet_id,
        epic_id=epic_id,
        statut=statut,
        priorite=priorite,
        non_planifiees=non_planifiees,
        tri=tri,
    )


# ─── Indicateurs story points ──────────────────────────────────────────────────

@router.get("/indicateurs", response_model=BacklogIndicateursResponse)
async def get_indicateurs(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: BacklogService = Depends(get_backlog_service),
):
    """
    Indicateurs agrégés pour le backlog :
    - total stories & points
    - points done
    - répartition par statut (nb + points)
    - répartition par epic (nb + points + points done)
    """
    return svc.get_indicateurs(projet_id)


# ─── Drag & drop — réordonnancement ───────────────────────────────────────────

@router.patch("/reordonner", response_model=List[BacklogItemResponse])
@require_role(ROLE_SCRUM_MASTER)
async def reordonner_backlog(
    projet_id: int,
    data: ReordonnerBacklogRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: BacklogService = Depends(get_backlog_service),
):
    """
    Drag & drop — redéfinir l'ordre des user stories dans le backlog.

    Envoyer la liste complète des IDs dans le nouvel ordre souhaité.
    Les IDs absents de la liste conservent leur position.

    Scrum Master uniquement.
    """
    return svc.reordonner(projet_id, data)
