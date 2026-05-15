from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.rbac.constants import (
    ROLE_DEVELOPPEUR,
    ROLE_PRODUCT_OWNER,
    ROLE_SCRUM_MASTER,
    ROLE_TESTEUR_QA,
)
from core.rbac.dependencies import get_current_user_with_role
from db.database import get_db
from models.user import Utilisateur
from schemas.anomalie import (
    AnomalieResponse,
    AssignAnomalieRequest,
    CreateAnomalieRequest,
    UpdateAnomalieRequest,
)
from services.anomalie_service import AnomalieService

router = APIRouter(
    prefix="/projets/{projet_id}/anomalies",
    tags=["anomalies"],
)

cas_router = APIRouter(
    prefix="/projets/{projet_id}/cahier-tests/{cahier_id}/cas-tests/{cas_id}/anomalies",
    tags=["anomalies"],
)


def get_service(db: Session = Depends(get_db)) -> AnomalieService:
    return AnomalieService(db)


def _get_role_code(current_user: Utilisateur) -> str:
    return current_user.role.code if current_user and current_user.role else ""


def _ensure_read_access(current_user: Utilisateur) -> None:
    role_code = _get_role_code(current_user)
    if role_code not in {
        ROLE_TESTEUR_QA,
        ROLE_DEVELOPPEUR,
        ROLE_SCRUM_MASTER,
        ROLE_PRODUCT_OWNER,
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role non autorise sur les anomalies.",
        )


def _ensure_qa_write(current_user: Utilisateur) -> None:
    if _get_role_code(current_user) != ROLE_TESTEUR_QA:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action autorisee uniquement pour Testeur QA.",
        )


@router.get("", response_model=List[AnomalieResponse], summary="Lister les anomalies du projet")
async def list_anomalies_projet(
    projet_id: int,
    statut: Optional[str] = Query(None),
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    svc: AnomalieService = Depends(get_service),
):
    _ensure_read_access(current_user)
    return svc.list_by_projet(projet_id, statut=statut)


@router.patch("/{anomalie_id}", response_model=AnomalieResponse, summary="Modifier une anomalie")
async def update_anomalie(
    projet_id: int,
    anomalie_id: int,
    body: UpdateAnomalieRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    svc: AnomalieService = Depends(get_service),
):
    _ensure_qa_write(current_user)
    return svc.update(
        projet_id=projet_id,
        anomalie_id=anomalie_id,
        payload=body.model_dump(exclude_none=True),
    )


@router.post("/{anomalie_id}/resolve", response_model=AnomalieResponse, summary="Resoudre une anomalie")
async def resolve_anomalie(
    projet_id: int,
    anomalie_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    svc: AnomalieService = Depends(get_service),
):
    _ensure_qa_write(current_user)
    return svc.resolve(projet_id, anomalie_id)


@router.post("/{anomalie_id}/assign", response_model=AnomalieResponse, summary="Assigner une anomalie")
async def assign_anomalie(
    projet_id: int,
    anomalie_id: int,
    body: AssignAnomalieRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    svc: AnomalieService = Depends(get_service),
):
    _ensure_qa_write(current_user)
    return svc.assign(
        projet_id,
        anomalie_id,
        body.assigned_to,
        actor_id=current_user.id,
    )


@router.post("/{anomalie_id}/reopen", response_model=AnomalieResponse, summary="Reouvrir une anomalie")
async def reopen_anomalie(
    projet_id: int,
    anomalie_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    svc: AnomalieService = Depends(get_service),
):
    _ensure_qa_write(current_user)
    return svc.reopen(projet_id, anomalie_id)


@cas_router.get("", response_model=List[AnomalieResponse], summary="Lister les anomalies d'un cas de test")
async def list_anomalies_cas_test(
    projet_id: int,
    cahier_id: int,
    cas_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    svc: AnomalieService = Depends(get_service),
):
    _ensure_read_access(current_user)
    return svc.list_by_cas_test(projet_id, cahier_id, cas_id)


@cas_router.post("", response_model=AnomalieResponse, status_code=status.HTTP_201_CREATED, summary="Creer une anomalie")
async def create_anomalie_cas_test(
    projet_id: int,
    cahier_id: int,
    cas_id: int,
    body: CreateAnomalieRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    svc: AnomalieService = Depends(get_service),
):
    _ensure_qa_write(current_user)
    return svc.create_for_cas_test(
        projet_id=projet_id,
        cahier_id=cahier_id,
        cas_id=cas_id,
        reporter_id=current_user.id,
        payload=body.model_dump(),
    )
