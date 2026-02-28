"""
Repository pour la gestion des epics
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from models.scrum import Epic
from repositories.base_repository import BaseRepository

# Valeurs autorisées pour le statut
STATUTS_VALIDES = {"to_do", "in_progress", "done"}


class EpicRepository(BaseRepository[Epic]):
    """Repository pour les epics liés à un module."""

    def __init__(self, db: Session):
        super().__init__(Epic, db)

    # ── Lecture ─────────────────────────────────────────────────────────────

    def get_by_module(self, module_id: int) -> List[Epic]:
        """Epics d'un module, ordonnés par priorité décroissante."""
        return (
            self.db.query(Epic)
            .filter(Epic.module_id == module_id)
            .order_by(Epic.priorite.desc())
            .all()
        )

    def get_by_module_with_userstories(self, module_id: int) -> List[Epic]:
        """Epics avec leurs user-stories chargées."""
        return (
            self.db.query(Epic)
            .options(joinedload(Epic.userstories))
            .filter(Epic.module_id == module_id)
            .order_by(Epic.priorite.desc())
            .all()
        )

    def get_by_id_in_module(self, epic_id: int, module_id: int) -> Optional[Epic]:
        """Récupérer un epic en vérifiant son appartenance au module."""
        return (
            self.db.query(Epic)
            .filter(Epic.id == epic_id, Epic.module_id == module_id)
            .first()
        )

    def get_by_statut(self, module_id: int, statut: str) -> List[Epic]:
        """Filtrer les epics d'un module par statut."""
        return (
            self.db.query(Epic)
            .filter(Epic.module_id == module_id, Epic.statut == statut)
            .order_by(Epic.priorite.desc())
            .all()
        )

    # ── Changement de statut ─────────────────────────────────────────────────

    def changer_statut(self, epic_id: int, statut: str) -> Optional[Epic]:
        """Mettre à jour uniquement le statut."""
        epic = self.get_by_id(epic_id)
        if epic:
            epic.statut = statut
            self.db.commit()
            self.db.refresh(epic)
        return epic

    # ── Priorisation ─────────────────────────────────────────────────────────

    def changer_priorite(self, epic_id: int, priorite: int) -> Optional[Epic]:
        """Mettre à jour uniquement la priorité."""
        epic = self.get_by_id(epic_id)
        if epic:
            epic.priorite = priorite
            self.db.commit()
            self.db.refresh(epic)
        return epic

    # ── Progression ──────────────────────────────────────────────────────────

    def calculer_progression(self, epic_id: int) -> dict:
        """
        Calculer la progression d'un epic basée sur ses user-stories.
        Retourne le nombre total, terminées et le pourcentage.
        """
        epic = self.db.query(Epic).options(joinedload(Epic.userstories)).filter(Epic.id == epic_id).first()
        if not epic:
            return {"total": 0, "terminees": 0, "pourcentage": 0}
        total = len(epic.userstories)
        terminees = sum(1 for us in epic.userstories if us.statut == "done")
        pourcentage = round((terminees / total) * 100) if total > 0 else 0
        return {"total": total, "terminees": terminees, "pourcentage": pourcentage}
