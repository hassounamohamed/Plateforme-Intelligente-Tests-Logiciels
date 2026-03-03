"""
Routes API pour la gestion des pièces jointes (Projet / Epic / User Story)
"""
import os
import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import Utilisateur
from models.attachment import Attachment
from models.scrum import Projet, Epic, UserStory
from core.rbac.dependencies import get_current_user_with_role
from schemas.attachment import AttachmentResponse

# ─── Configuration ────────────────────────────────────────────────────────────

UPLOAD_ROOT = "uploads"

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "text/plain",
    "text/x-log",
    "application/octet-stream",   # fallback générique pour les logs
}

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".png", ".jpg", ".jpeg", ".txt", ".log"}

MAX_FILE_SIZE_MB = 10


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _valider_fichier(file: UploadFile):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Extension '{ext}' non autorisée. Acceptées : {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )


def _sauvegarder(file: UploadFile, sub_dir: str) -> tuple[str, str, int]:
    """Écrit le fichier sur disque. Retourne (filename_unique, filepath, taille)."""
    os.makedirs(os.path.join(UPLOAD_ROOT, sub_dir), exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_ROOT, sub_dir, unique_name)

    content = file.file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Fichier trop volumineux ({size_mb:.1f} MB). Maximum : {MAX_FILE_SIZE_MB} MB.",
        )

    with open(filepath, "wb") as f:
        f.write(content)

    return unique_name, filepath, len(content)


def _get_attachment_ou_404(att_id: int, db: Session) -> Attachment:
    att = db.query(Attachment).filter(Attachment.id == att_id).first()
    if not att:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Pièce jointe {att_id} introuvable.")
    return att


# ─── Router ───────────────────────────────────────────────────────────────────

router = APIRouter(tags=["attachments"])


# ══════════════════════════════════════════════════════════════════════════════
# PROJET
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/projets/{projet_id}/attachments",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ajouter une pièce jointe à un projet",
)
async def upload_projet_attachment(
    projet_id: int,
    file: UploadFile = File(...),
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    db: Session = Depends(get_db),
):
    projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not projet:
        raise HTTPException(status_code=404, detail=f"Projet {projet_id} introuvable.")

    _valider_fichier(file)
    _, filepath, _ = _sauvegarder(file, f"projets/{projet_id}")

    att = Attachment(
        filename=file.filename,
        filepath=filepath,
        content_type=file.content_type or "application/octet-stream",
        uploaded_by_id=current_user.id,
        projet_id=projet_id,
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return att


@router.get(
    "/projets/{projet_id}/attachments",
    response_model=List[AttachmentResponse],
    summary="Lister les pièces jointes d'un projet",
)
async def list_projet_attachments(
    projet_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    db: Session = Depends(get_db),
):
    return db.query(Attachment).filter(Attachment.projet_id == projet_id).all()


# ══════════════════════════════════════════════════════════════════════════════
# EPIC
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/projets/{projet_id}/modules/{module_id}/epics/{epic_id}/attachments",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ajouter une pièce jointe à un epic",
)
async def upload_epic_attachment(
    projet_id: int,
    module_id: int,
    epic_id: int,
    file: UploadFile = File(...),
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    db: Session = Depends(get_db),
):
    epic = db.query(Epic).filter(Epic.id == epic_id, Epic.module_id == module_id).first()
    if not epic:
        raise HTTPException(status_code=404, detail=f"Epic {epic_id} introuvable.")

    _valider_fichier(file)
    _, filepath, _ = _sauvegarder(file, f"epics/{epic_id}")

    att = Attachment(
        filename=file.filename,
        filepath=filepath,
        content_type=file.content_type or "application/octet-stream",
        uploaded_by_id=current_user.id,
        epic_id=epic_id,
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return att


@router.get(
    "/projets/{projet_id}/modules/{module_id}/epics/{epic_id}/attachments",
    response_model=List[AttachmentResponse],
    summary="Lister les pièces jointes d'un epic",
)
async def list_epic_attachments(
    projet_id: int,
    module_id: int,
    epic_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    db: Session = Depends(get_db),
):
    return db.query(Attachment).filter(Attachment.epic_id == epic_id).all()


# ══════════════════════════════════════════════════════════════════════════════
# USER STORY
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/projets/{projet_id}/modules/{module_id}/epics/{epic_id}/userstories/{us_id}/attachments",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ajouter une pièce jointe à une user story",
)
async def upload_userstory_attachment(
    projet_id: int,
    module_id: int,
    epic_id: int,
    us_id: int,
    file: UploadFile = File(...),
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    db: Session = Depends(get_db),
):
    us = db.query(UserStory).filter(UserStory.id == us_id, UserStory.epic_id == epic_id).first()
    if not us:
        raise HTTPException(status_code=404, detail=f"User story {us_id} introuvable.")

    _valider_fichier(file)
    _, filepath, _ = _sauvegarder(file, f"userstories/{us_id}")

    att = Attachment(
        filename=file.filename,
        filepath=filepath,
        content_type=file.content_type or "application/octet-stream",
        uploaded_by_id=current_user.id,
        userstory_id=us_id,
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return att


@router.get(
    "/projets/{projet_id}/modules/{module_id}/epics/{epic_id}/userstories/{us_id}/attachments",
    response_model=List[AttachmentResponse],
    summary="Lister les pièces jointes d'une user story",
)
async def list_userstory_attachments(
    projet_id: int,
    module_id: int,
    epic_id: int,
    us_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    db: Session = Depends(get_db),
):
    return db.query(Attachment).filter(Attachment.userstory_id == us_id).all()


# ══════════════════════════════════════════════════════════════════════════════
# TÉLÉCHARGEMENT & SUPPRESSION (communs)
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/attachments/{att_id}/download",
    summary="Télécharger une pièce jointe",
)
async def download_attachment(
    att_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    db: Session = Depends(get_db),
):
    att = _get_attachment_ou_404(att_id, db)
    if not os.path.exists(att.filepath):
        raise HTTPException(status_code=404, detail="Fichier introuvable sur le serveur.")
    return FileResponse(
        path=att.filepath,
        filename=att.filename,
        media_type=att.content_type,
    )


@router.delete(
    "/attachments/{att_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer une pièce jointe",
)
async def delete_attachment(
    att_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)] = None,
    db: Session = Depends(get_db),
):
    att = _get_attachment_ou_404(att_id, db)

    # Supprimer le fichier physique
    if os.path.exists(att.filepath):
        os.remove(att.filepath)

    db.delete(att)
    db.commit()
