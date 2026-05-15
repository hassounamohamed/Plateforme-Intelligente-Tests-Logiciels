"""
Repository pour la gestion des epics
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from models.scrum import Epic, Module
from repositories.base_repository import BaseRepository

# Valeurs autorisées pour le statut
STATUTS_VALIDES = {"to_do", "in_progress", "done"}


class EpicRepository(BaseRepository[Epic]):
    """Repository pour les epics liés à un projet."""

    def __init__(self, db: Session):
        super().__init__(Epic, db)

    # ── Lecture ─────────────────────────────────────────────────────────────

    def get_by_projet(self, projet_id: int) -> List[Epic]:
        """Epics d'un projet, ordonnés par priorité décroissante."""
        return (
            self.db.query(Epic)
            .join(Module, Epic.module_id == Module.id)
            .filter(Module.projet_id == projet_id)
            .order_by(Epic.priorite.desc())
            .all()
        )

    def get_by_projet_with_userstories(self, projet_id: int) -> List[Epic]:
        """Epics avec leurs user-stories chargées."""
        return (
            self.db.query(Epic)
            .options(joinedload(Epic.userstories))
            .join(Module, Epic.module_id == Module.id)
            .filter(Module.projet_id == projet_id)
            .order_by(Epic.priorite.desc())
            .all()
        )

    def get_by_id_in_projet(self, epic_id: int, projet_id: int) -> Optional[Epic]:
        """Récupérer un epic en vérifiant son appartenance au projet."""
        return (
            self.db.query(Epic)
            .join(Module, Epic.module_id == Module.id)
            .filter(Epic.id == epic_id, Module.projet_id == projet_id)
            .first()
        )

    def get_by_statut(self, projet_id: int, statut: str) -> List[Epic]:
        """Filtrer les epics d'un projet par statut."""
        return (
            self.db.query(Epic)
            .join(Module, Epic.module_id == Module.id)
            .filter(Module.projet_id == projet_id, Epic.statut == statut)
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
