from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

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


router = APIRouter(prefix="/projets/{projet_id}/anomalies", tags=["anomalies"])
cas_router = APIRouter(
    prefix="/projets/{projet_id}/cahier-tests/{cahier_id}/cas-tests/{cas_id}/anomalies",
    tags=["anomalies"],
)
legacy_cas_router = APIRouter(
    prefix="/projets/{projet_id}/cahiers/{cahier_id}/cas/{cas_id}/anomalies",
    tags=["anomalies"],
)


def get_anomalie_service(db: Session = Depends(get_db)) -> AnomalieService:
    return AnomalieService(db)


@router.get("", response_model=List[AnomalieResponse])
async def list_anomalies_by_project(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    statut: str | None = None,
    svc: AnomalieService = Depends(get_anomalie_service),
):
    _ = current_user
    return svc.list_by_projet(projet_id, statut=statut)


@router.put("/{anomalie_id}", response_model=AnomalieResponse)
async def update_anomalie(
    projet_id: int,
    anomalie_id: int,
    body: UpdateAnomalieRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AnomalieService = Depends(get_anomalie_service),
):
    _ = current_user
    return svc.update(projet_id, anomalie_id, body.model_dump(exclude_unset=True))


@router.post("/{anomalie_id}/resolve", response_model=AnomalieResponse, status_code=status.HTTP_200_OK)
async def resolve_anomalie(
    projet_id: int,
    anomalie_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AnomalieService = Depends(get_anomalie_service),
):
    _ = current_user
    return svc.resolve(projet_id, anomalie_id)


@router.post("/{anomalie_id}/assign", response_model=AnomalieResponse)
async def assign_anomalie(
    projet_id: int,
    anomalie_id: int,
    body: AssignAnomalieRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AnomalieService = Depends(get_anomalie_service),
):
    return svc.assign(projet_id, anomalie_id, body.assigned_to, actor_id=current_user.id)


@router.post("/{anomalie_id}/reopen", response_model=AnomalieResponse)
async def reopen_anomalie(
    projet_id: int,
    anomalie_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AnomalieService = Depends(get_anomalie_service),
):
    _ = current_user
    return svc.reopen(projet_id, anomalie_id)


@cas_router.get("", response_model=List[AnomalieResponse])
async def list_anomalies_by_cas_test(
    projet_id: int,
    cahier_id: int,
    cas_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AnomalieService = Depends(get_anomalie_service),
):
    _ = current_user
    return svc.list_by_cas_test(projet_id, cahier_id, cas_id)


@cas_router.post("", response_model=AnomalieResponse, status_code=status.HTTP_201_CREATED)
async def create_anomalie_for_cas_test(
    projet_id: int,
    cahier_id: int,
    cas_id: int,
    body: CreateAnomalieRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AnomalieService = Depends(get_anomalie_service),
):
    return svc.create_for_cas_test(
        projet_id,
        cahier_id,
        cas_id,
        current_user.id,
        body.model_dump(exclude_unset=True),
    )


@legacy_cas_router.get("", response_model=List[AnomalieResponse])
async def list_anomalies_by_cas_test_legacy(
    projet_id: int,
    cahier_id: int,
    cas_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AnomalieService = Depends(get_anomalie_service),
):
    _ = current_user
    return svc.list_by_cas_test(projet_id, cahier_id, cas_id)


@legacy_cas_router.post("", response_model=AnomalieResponse, status_code=status.HTTP_201_CREATED)
async def create_anomalie_for_cas_test_legacy(
    projet_id: int,
    cahier_id: int,
    cas_id: int,
    body: CreateAnomalieRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: AnomalieService = Depends(get_anomalie_service),
):
    return svc.create_for_cas_test(
        projet_id,
        cahier_id,
        cas_id,
        current_user.id,
        body.model_dump(exclude_unset=True),
    )