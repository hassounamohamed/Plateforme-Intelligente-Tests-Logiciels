"""
Routes API pour la génération IA de tests unitaires par User Story.

Endpoints :
  POST   /projets/{projet_id}/userstories/{us_id}/unit-tests/generate
         Upload d'un fichier source + lancement de la génération (non-bloquant)

  GET    /projets/{projet_id}/userstories/{us_id}/unit-tests/generations
         Lister les jobs de génération pour cette User Story

  GET    /projets/{projet_id}/userstories/{us_id}/unit-tests/generations/{gen_id}
         Détail d'un job (progression en temps réel + logs)

  GET    /projets/{projet_id}/userstories/{us_id}/unit-tests
         Récupérer le cahier de tests + liste des tests unitaires générés

  GET    /projets/{projet_id}/userstories/{us_id}/unit-tests/{test_id}
         Détail complet d'un test (code, scénarios, exécutions, validations)

  PATCH  /projets/{projet_id}/userstories/{us_id}/unit-tests/{test_id}
         Modifier le code ou les métadonnées d'un test (éditeur)

  POST   /projets/{projet_id}/userstories/{us_id}/unit-tests/{test_id}/execute
         Exécuter un test localement (ou via Docker)

  GET    /projets/{projet_id}/userstories/{us_id}/unit-tests/{test_id}/executions
         Historique des exécutions d'un test

  POST   /projets/{projet_id}/userstories/{us_id}/unit-tests/{test_id}/validate
         Valider ou rejeter un test unitaire
"""
import os
from typing import Annotated, List

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from core.rbac.dependencies import get_current_user_with_role
from db.database import get_db
from models.user import Utilisateur
from schemas.ai_generation import AIGenerationDetailResponse, AIGenerationResponse
from schemas.unit_tests import (
    CahierDeTestsResponse,
    ExecutionTestResponse,
    TestUnitaireResponse,
    TestUnitaireSummaryResponse,
    UpdateTestUnitaireRequest,
    ValiderTestRequest,
    ValidationTestResponse,
)
from services.unit_test_service import UnitTestService

router = APIRouter(
    prefix="/projets/{projet_id}/userstories/{us_id}/unit-tests",
    tags=["unit-tests"],
)

# ─── Contraintes fichier source ───────────────────────────────────────────────

# Extensions binaires rejetées (non-texte) — tout autre fichier est accepté
BINARY_EXTENSIONS = {
    ".exe", ".dll", ".so", ".dylib", ".bin", ".obj", ".o", ".a", ".lib",
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg", ".webp",
    ".mp3", ".mp4", ".avi", ".mov", ".wav", ".flac",
    ".zip", ".tar", ".gz", ".rar", ".7z", ".jar", ".war",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".class", ".pyc", ".pyo",
}
MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB


def get_svc(db: Session = Depends(get_db)) -> UnitTestService:
    return UnitTestService(db)


# ─── Génération ───────────────────────────────────────────────────────────────

@router.post(
    "/generate",
    response_model=AIGenerationResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Uploader un fichier source et générer les tests unitaires via l'IA — le modèle IA détecte automatiquement le langage et le framework",
)
async def generer_tests(
    projet_id: int,
    us_id: int,
    background_tasks: BackgroundTasks,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    file: UploadFile = File(
        ...,
        description=(
            "Fichier source dans n'importe quel langage. "
            "Le modèle IA détecte le langage et choisit le framework de test adapté. "
            "Formats courants : .py, .js, .ts, .java, .rb, .go, .cs, .php, .c, .cpp, .kt, .rs…"
        ),
    ),
    svc: UnitTestService = Depends(get_svc),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext in BINARY_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Extension binaire '{ext}' non supportée. "
                "Veuillez uploader un fichier source texte."
            ),
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Fichier trop volumineux. Maximum : 2 MB.",
        )
    if not content.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Le fichier source est vide.",
        )

    gen = svc.demarrer_generation(
        us_id, projet_id, current_user.id, content, file.filename
    )
    background_tasks.add_task(svc.executer_generation, gen.id, us_id, file.filename)
    return gen


# ─── Suivi de génération ──────────────────────────────────────────────────────

@router.get(
    "/generations",
    response_model=List[AIGenerationResponse],
    summary="Lister les jobs de génération de tests unitaires pour ce projet",
)
async def list_generations(
    projet_id: int,
    us_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UnitTestService = Depends(get_svc),
):
    return svc.list_generations(projet_id)


@router.get(
    "/generations/{gen_id}",
    response_model=AIGenerationDetailResponse,
    summary="Détail d'un job de génération (progression + logs en temps réel)",
)
async def get_generation(
    projet_id: int,
    us_id: int,
    gen_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UnitTestService = Depends(get_svc),
):
    return svc.get_generation(gen_id, projet_id)


# ─── Lecture des tests ────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=CahierDeTestsResponse,
    summary="Cahier de tests + liste des tests unitaires générés pour cette User Story",
)
async def get_cahier(
    projet_id: int,
    us_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UnitTestService = Depends(get_svc),
):
    cahier = svc.get_cahier(us_id, projet_id)
    tests  = svc.get_unit_tests(us_id, projet_id)
    return CahierDeTestsResponse(
        id               = cahier.id,
        dateGeneration   = cahier.dateGeneration,
        statut           = cahier.statut,
        nombreTests      = cahier.nombreTests,
        userstory_id     = cahier.userstory_id,
        ai_generation_id = cahier.ai_generation_id,
        tests            = tests,
    )


@router.get(
    "/{test_id}",
    response_model=TestUnitaireResponse,
    summary="Détail complet d'un test unitaire (code, scénarios, exécutions, validations)",
)
async def get_test(
    projet_id: int,
    us_id: int,
    test_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UnitTestService = Depends(get_svc),
):
    return svc.get_test(test_id, us_id, projet_id)


# ─── Édition du test ──────────────────────────────────────────────────────────

@router.patch(
    "/{test_id}",
    response_model=TestUnitaireResponse,
    summary="Modifier le code ou les métadonnées d'un test unitaire (éditeur)",
)
async def modifier_test(
    projet_id: int,
    us_id: int,
    test_id: int,
    body: UpdateTestUnitaireRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UnitTestService = Depends(get_svc),
):
    return svc.modifier_test(test_id, us_id, projet_id, body)


# ─── Exécution ────────────────────────────────────────────────────────────────

@router.post(
    "/{test_id}/execute",
    response_model=ExecutionTestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Exécuter un test unitaire (localement ou via Docker)",
)
async def executer_test(
    projet_id: int,
    us_id: int,
    test_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    docker: bool = False,
    svc: UnitTestService = Depends(get_svc),
):
    return svc.executer_test(test_id, us_id, projet_id, current_user.id, docker)


@router.get(
    "/{test_id}/executions",
    response_model=List[ExecutionTestResponse],
    summary="Historique d'exécutions d'un test unitaire (du plus récent au plus ancien)",
)
async def get_executions(
    projet_id: int,
    us_id: int,
    test_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UnitTestService = Depends(get_svc),
):
    return svc.get_executions(test_id, us_id, projet_id)


# ─── Validation ───────────────────────────────────────────────────────────────

@router.post(
    "/{test_id}/validate",
    response_model=ValidationTestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Valider ou rejeter un test unitaire (décision Go / No-Go)",
)
async def valider_test(
    projet_id: int,
    us_id: int,
    test_id: int,
    body: ValiderTestRequest,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: UnitTestService = Depends(get_svc),
):
    return svc.valider_test(test_id, us_id, projet_id, current_user.id, body)
