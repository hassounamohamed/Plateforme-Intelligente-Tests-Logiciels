"""
Service métier pour la vue backlog projet
"""
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from repositories.backlog_repository import BacklogRepository
from repositories.projet_repository import ProjetRepository
from schemas.backlog import ReordonnerBacklogRequest

TRIS_VALIDES = {"priorite", "points", "ordre", "statut"}
STATUTS_VALIDES = {"to_do", "in_progress", "done"}
PRIORITES_VALIDES = {"must_have", "should_have", "could_have", "wont_have"}


class BacklogService:
    def __init__(self, db: Session):
        self.repo = BacklogRepository(db)
        self.projet_repo = ProjetRepository(db)

    def _verifier_projet(self, projet_id: int):
        projet = self.projet_repo.get_by_id(projet_id)
        if not projet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Projet {projet_id} introuvable.")
        return projet

    # ── Backlog ──────────────────────────────────────────────────────────────

    def get_backlog(
        self,
        projet_id: int,
        epic_id: Optional[int],
        statut: Optional[str],
        priorite: Optional[str],
        non_planifiees: bool,
        tri: str,
    ) -> List:
        self._verifier_projet(projet_id)

        if statut and statut not in STATUTS_VALIDES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Statut invalide. Valeurs : {', '.join(STATUTS_VALIDES)}",
            )
        if priorite and priorite not in PRIORITES_VALIDES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Priorité invalide. Valeurs : {', '.join(PRIORITES_VALIDES)}",
            )
        if tri not in TRIS_VALIDES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Tri invalide. Valeurs : {', '.join(TRIS_VALIDES)}",
            )

        return self.repo.get_backlog(
            projet_id=projet_id,
            epic_id=epic_id,
            statut=statut,
            priorite=priorite,
            non_planifiees=non_planifiees,
            tri=tri,
        )

    # ── Indicateurs ──────────────────────────────────────────────────────────

    def get_indicateurs(self, projet_id: int) -> dict:
        self._verifier_projet(projet_id)
        return self.repo.get_indicateurs(projet_id)

    # ── Drag & drop ──────────────────────────────────────────────────────────

    def reordonner(self, projet_id: int, data: ReordonnerBacklogRequest) -> List:
        self._verifier_projet(projet_id)
        return self.repo.reordonner(projet_id, data.ordre)
