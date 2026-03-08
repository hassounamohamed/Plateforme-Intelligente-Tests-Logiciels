"""
Routes API pour le Cahier de Tests Global.

Endpoints :
  POST   /projets/{projet_id}/cahier-tests/generate                        Générer le cahier via IA (async)
  GET    /projets/{projet_id}/cahier-tests/generations                     Lister les jobs de génération
  GET    /projets/{projet_id}/cahier-tests/generations/{gen_id}            Détail + logs d'un job
  GET    /projets/{projet_id}/cahier-tests                                 Récupérer le cahier (résumé)
  GET    /projets/{projet_id}/cahier-tests/detail                          Cahier + tous les cas de tests
  GET    /projets/{projet_id}/cahier-tests/{cahier_id}/cas-tests           Lister les cas de tests
  PATCH  /projets/{projet_id}/cahier-tests/{cahier_id}/cas-tests/{cas_id} Modifier un cas de test
  PATCH  /projets/{projet_id}/cahier-tests/{cahier_id}/valider             Valider le cahier
  GET    /projets/{projet_id}/cahier-tests/{cahier_id}/export/excel        Export Excel
  GET    /projets/{projet_id}/cahier-tests/{cahier_id}/export/word         Export Word
  GET    /projets/{projet_id}/cahier-tests/{cahier_id}/export/pdf          Export PDF
"""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Body, BackgroundTasks, Depends, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from core.rbac.dependencies import get_current_user_with_role
from db.database import get_db
from models.user import Utilisateur
from schemas.ai_generation import AIGenerationDetailResponse, AIGenerationResponse
from schemas.cahier_test_global import (
    CahierTestGlobalDetailResponse,
    CahierTestGlobalResponse,
    CasTestResponse,
    GenererCahierRequest,
    StatistiquesResponse,
    UpdateCasTestRequest,
    ValiderCahierRequest,
)
from services.cahier_test_global_service import CahierTestGlobalService

router = APIRouter(
    prefix="/projets/{projet_id}/cahier-tests",
    tags=["cahier-tests-global"],
)


def get_service(db: Session = Depends(get_db)) -> CahierTestGlobalService:
    return CahierTestGlobalService(db)


# ─── Générer le cahier (async) ────────────────────────────────────────────────

@router.post(
    "/generate",
    response_model=AIGenerationResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Générer le Cahier de Tests Global via l'IA (non-bloquant)",
)
async def generer_cahier(
    projet_id: int,
    background_tasks: BackgroundTasks,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    body: GenererCahierRequest = GenererCahierRequest(),
    svc: CahierTestGlobalService = Depends(get_service),
):
    """
    Démarre la génération du cahier de tests en arrière-plan.
    Retourne immédiatement le job AIGeneration (status=pending).

    Interroger **GET /generations/{id}** pour suivre la progression et les logs.
    Dès que status=completed, le cahier est disponible via **GET /detail**.
    """
    gen = svc.demarrer_generation(projet_id, current_user.id, body.version)
    background_tasks.add_task(svc.executer_generation, gen.id)
    return gen


# ─── Générations (polling) ────────────────────────────────────────────────────

@router.get(
    "/generations",
    response_model=List[AIGenerationResponse],
    summary="Lister tous les jobs de génération du cahier de tests",
)
async def list_generations(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: CahierTestGlobalService = Depends(get_service),
):
    return svc.list_generations(projet_id)


@router.get(
    "/generations/{gen_id}",
    response_model=AIGenerationDetailResponse,
    summary="Détail d'un job de génération (progression + logs)",
)
async def get_generation(
    projet_id: int,
    gen_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: CahierTestGlobalService = Depends(get_service),
):
    """
    Interroger cet endpoint en polling pour suivre la progression.
    - **progress** : 0 → 100
    - **status**   : pending | processing | completed | failed
    - **logs**     : liste des étapes avec message et horodatage
    """
    return svc.get_generation(gen_id, projet_id)


# ─── Récupérer le cahier ──────────────────────────────────────────────────────

@router.get(
    "",
    response_model=CahierTestGlobalResponse,
    summary="Récupérer le résumé du Cahier de Tests Global",
)
async def get_cahier(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: CahierTestGlobalService = Depends(get_service),
):
    return svc.get_cahier(projet_id)


@router.get(
    "/detail",
    response_model=CahierTestGlobalDetailResponse,
    summary="Récupérer le Cahier de Tests Global avec tous ses cas de tests",
)
async def get_cahier_detail(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: CahierTestGlobalService = Depends(get_service),
):
    return svc.get_cahier_detail(projet_id)


@router.get(
    "/stats",
    response_model=StatistiquesResponse,
    summary="Statistiques du cahier de tests (nb réussi, échoué, bloqué, non exécuté)",
)
async def get_statistiques(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: CahierTestGlobalService = Depends(get_service),
):
    return svc.get_statistiques(projet_id)


# ─── Cas de tests ─────────────────────────────────────────────────────────────

@router.get(
    "/{cahier_id}/cas-tests",
    response_model=List[CasTestResponse],
    summary="Lister tous les cas de tests du cahier",
)
async def list_cas_tests(
    projet_id: int,
    cahier_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: CahierTestGlobalService = Depends(get_service),
):
    return svc.list_cas_tests(cahier_id, projet_id)


@router.patch(
    "/{cahier_id}/cas-tests/{cas_id}",
    response_model=CasTestResponse,
    summary="Modifier un cas de test (résultat, statut, commentaire…)",
)
async def update_cas_test(
    projet_id: int,
    cahier_id: int,
    cas_id: int,
    body: UpdateCasTestRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: CahierTestGlobalService = Depends(get_service),
):
    return svc.update_cas_test(cahier_id, cas_id, projet_id, body)


# ─── Validation ───────────────────────────────────────────────────────────────

@router.patch(
    "/{cahier_id}/valider",
    response_model=CahierTestGlobalResponse,
    summary="Valider le cahier de tests (passage en statut 'valide')",
)
async def valider_cahier(
    projet_id: int,
    cahier_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: CahierTestGlobalService = Depends(get_service),
    body: ValiderCahierRequest = Body(default_factory=ValiderCahierRequest),
):
    return svc.valider_cahier(cahier_id, projet_id, body.version)


# ─── Exports ──────────────────────────────────────────────────────────────────

@router.get(
    "/{cahier_id}/export/excel",
    summary="Exporter le cahier de tests en Excel (.xlsx)",
    responses={200: {"content": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}}}},
)
async def export_excel(
    projet_id: int,
    cahier_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: CahierTestGlobalService = Depends(get_service),
):
    data = svc.exporter_excel(cahier_id, projet_id)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=cahier_tests_projet_{projet_id}.xlsx"},
    )


@router.get(
    "/{cahier_id}/export/word",
    summary="Exporter le cahier de tests en Word (.docx)",
    responses={200: {"content": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document": {}}}},
)
async def export_word(
    projet_id: int,
    cahier_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: CahierTestGlobalService = Depends(get_service),
):
    data = svc.exporter_word(cahier_id, projet_id)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=cahier_tests_projet_{projet_id}.docx"},
    )


@router.get(
    "/{cahier_id}/export/pdf",
    summary="Exporter le cahier de tests en PDF",
    responses={200: {"content": {"application/pdf": {}}}},
)
async def export_pdf(
    projet_id: int,
    cahier_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: CahierTestGlobalService = Depends(get_service),
):
    data = svc.exporter_pdf(cahier_id, projet_id)
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cahier_tests_projet_{projet_id}.pdf"},
    )
