"""
Repository dédié aux sprints
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload

from models.scrum import Sprint, UserStory
from repositories.base_repository import BaseRepository

STATUTS_VALIDES = {"planifie", "en_cours", "termine"}


class SprintRepository(BaseRepository[Sprint]):

    def __init__(self, db: Session):
        super().__init__(Sprint, db)

    # ── Lecture ─────────────────────────────────────────────────────────────

    def get_by_projet(self, projet_id: int) -> List[Sprint]:
        return (
            self.db.query(Sprint)
            .filter(Sprint.projet_id == projet_id)
            .order_by(Sprint.dateDebut.asc())
            .all()
        )

    def get_by_id_in_projet(self, sprint_id: int, projet_id: int) -> Optional[Sprint]:
        return (
            self.db.query(Sprint)
            .filter(Sprint.id == sprint_id, Sprint.projet_id == projet_id)
            .first()
        )

    def get_actif(self, projet_id: int) -> Optional[Sprint]:
        """Sprint en cours pour un projet."""
        return (
            self.db.query(Sprint)
            .filter(Sprint.projet_id == projet_id, Sprint.statut == "en_cours")
            .first()
        )

    def get_with_userstories(self, sprint_id: int) -> Optional[Sprint]:
        from models.scrum import UserStory
        return (
            self.db.query(Sprint)
            .options(
                joinedload(Sprint.userstories).joinedload(UserStory.epic)
            )
            .filter(Sprint.id == sprint_id)
            .first()
        )

    # ── Cycle de vie ─────────────────────────────────────────────────────────

    def demarrer(self, sprint_id: int) -> Optional[Sprint]:
        sprint = self.get_by_id(sprint_id)
        if sprint:
            sprint.statut = "en_cours"
            if not sprint.dateDebut:
                sprint.dateDebut = datetime.utcnow()
            self.db.commit()
            self.db.refresh(sprint)
        return sprint

    def cloturer(self, sprint_id: int) -> Optional[Sprint]:
        sprint = self.get_by_id(sprint_id)
        if sprint:
            sprint.statut = "termine"
            if not sprint.dateFin:
                sprint.dateFin = datetime.utcnow()
            # Calcul automatique de la vélocité à la clôture
            sprint.velocite = self._calculer_velocite(sprint)
            self.db.commit()
            self.db.refresh(sprint)
        return sprint

    # ── User Stories ─────────────────────────────────────────────────────────

    def ajouter_userstories(self, sprint_id: int, us_ids: List[int]) -> Optional[Sprint]:
        sprint = self.get_with_userstories(sprint_id)
        if sprint:
            existing_ids = {us.id for us in sprint.userstories}
            nouvelles = (
                self.db.query(UserStory)
                .filter(UserStory.id.in_(us_ids))
                .all()
            )
            for us in nouvelles:
                if us.id not in existing_ids:
                    sprint.userstories.append(us)
            self.db.commit()
            self.db.refresh(sprint)
        return sprint

    def retirer_userstories(self, sprint_id: int, us_ids: List[int]) -> Optional[Sprint]:
        sprint = self.get_with_userstories(sprint_id)
        if sprint:
            sprint.userstories = [us for us in sprint.userstories if us.id not in us_ids]
            self.db.commit()
            self.db.refresh(sprint)
        return sprint

    # ── Vélocité ─────────────────────────────────────────────────────────────

    def calculer_velocite(self, sprint_id: int) -> dict:
        sprint = self.get_with_userstories(sprint_id)
        if not sprint:
            return {"sprint_id": sprint_id, "velocite": 0, "points_total": 0, "points_termines": 0}
        velocite = self._calculer_velocite(sprint)
        points_total = sum(us.points or 0 for us in sprint.userstories)
        return {
            "sprint_id": sprint.id,
            "nom": sprint.nom,
            "statut": sprint.statut,
            "velocite": velocite,
            "points_total": points_total,
            "points_termines": velocite,
            "nb_userstories": len(sprint.userstories),
            "nb_terminees": sum(1 for us in sprint.userstories if us.statut == "done"),
        }

    @staticmethod
    def _calculer_velocite(sprint: Sprint) -> int:
        """Somme des story points des user stories 'done'."""
        return sum(us.points or 0 for us in sprint.userstories if us.statut == "done")
