from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
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
from schemas.rapport import (
    GenererRapportQARequest,
    RapportQAResponse,
    UpdateRapportQARequest,
)
from services.rapport_service import RapportService

router = APIRouter(
    prefix="/projets/{projet_id}/rapports",
    tags=["rapports-qa"],
)


def get_service(db: Session = Depends(get_db)) -> RapportService:
    return RapportService(db)


def _get_role_code(current_user: Utilisateur) -> str:
    return current_user.role.code if current_user and current_user.role else ""


def _ensure_rapport_allowed_role(current_user: Utilisateur) -> None:
    role_code = _get_role_code(current_user)
    if role_code not in {ROLE_TESTEUR_QA, ROLE_DEVELOPPEUR, ROLE_SCRUM_MASTER, ROLE_PRODUCT_OWNER}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role non autorise sur le rapport QA.",
        )


def _ensure_testeur_only(current_user: Utilisateur) -> None:
    role_code = _get_role_code(current_user)
    if role_code != ROLE_TESTEUR_QA:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action autorisee uniquement pour Testeur QA.",
        )


@router.post(
    "/cahier/{cahier_id}/generate",
    response_model=RapportQAResponse,
    summary="Generer le rapport QA depuis le cahier global (manuel ou IA)",
)
async def generer_rapport_qa(
    projet_id: int,
    cahier_id: int,
    body: GenererRapportQARequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: RapportService = Depends(get_service),
):
    _ensure_rapport_allowed_role(current_user)
    _ensure_testeur_only(current_user)
    return svc.generer_rapport_qa(
        cahier_id=cahier_id,
        projet_id=projet_id,
        user_id=current_user.id,
        mode_generation=body.mode_generation,
        version=body.version,
        recommandations=body.recommandations,
    )


@router.patch(
    "/cahier/{cahier_id}",
    response_model=RapportQAResponse,
    summary="Modifier le rapport QA (Testeur QA uniquement)",
)
async def update_rapport_qa(
    projet_id: int,
    cahier_id: int,
    body: UpdateRapportQARequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: RapportService = Depends(get_service),
):
    _ensure_rapport_allowed_role(current_user)
    _ensure_testeur_only(current_user)
    return svc.update_rapport_qa(
        cahier_id=cahier_id,
        projet_id=projet_id,
        user_id=current_user.id,
        payload=body.model_dump(exclude_none=True),
    )


@router.get(
    "/cahier/{cahier_id}",
    response_model=RapportQAResponse,
    summary="Consulter le rapport QA",
)
async def get_rapport_qa(
    projet_id: int,
    cahier_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: RapportService = Depends(get_service),
):
    _ensure_rapport_allowed_role(current_user)
    return svc.get_rapport_qa(cahier_id, projet_id)


@router.get(
    "/cahier/{cahier_id}/export/pdf",
    summary="Exporter le rapport QA en PDF",
    responses={200: {"content": {"application/pdf": {}}}},
)
async def export_rapport_qa_pdf(
    projet_id: int,
    cahier_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: RapportService = Depends(get_service),
):
    _ensure_rapport_allowed_role(current_user)
    data = svc.exporter_rapport_qa_pdf(cahier_id, projet_id)
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=rapport_qa_projet_{projet_id}.pdf"},
    )


@router.get(
    "/cahier/{cahier_id}/export/word",
    summary="Exporter le rapport QA en Word (.docx)",
    responses={200: {"content": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document": {}}}},
)
async def export_rapport_qa_word(
    projet_id: int,
    cahier_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: RapportService = Depends(get_service),
):
    _ensure_rapport_allowed_role(current_user)
    data = svc.exporter_rapport_qa_word(cahier_id, projet_id)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=rapport_qa_projet_{projet_id}.docx"},
    )
