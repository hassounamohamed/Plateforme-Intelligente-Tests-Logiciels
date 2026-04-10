"""
Repository pour la vue backlog projet (agrégation cross-epics)
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from models.scrum import UserStory, Epic, Module, Sprint
from db.associations import sprint_userstory
from repositories.base_repository import BaseRepository

ORDRE_MOSCOW = {"must_have": 0, "should_have": 1, "could_have": 2, "wont_have": 3}


class BacklogRepository:

    def __init__(self, db: Session):
        self.db = db

    # ── Requête de base ──────────────────────────────────────────────────────

    def _query_projet(self, projet_id: int):
        """Toutes les user stories appartenant à un projet via Module→Epic."""
        return (
            self.db.query(UserStory)
            .join(Epic, UserStory.epic_id == Epic.id)
            .join(Module, Epic.module_id == Module.id)
            .filter(Module.projet_id == projet_id)
        )

    # ── Backlog filtré ───────────────────────────────────────────────────────

    def get_backlog(
        self,
        projet_id: int,
        module_id: Optional[int] = None,
        epic_id: Optional[int] = None,
        statut: Optional[str] = None,
        priorite: Optional[str] = None,
        non_planifiees: bool = False,
        tri: str = "priorite",
    ) -> List[UserStory]:
        """
        Retourne les user stories du projet avec filtres optionnels.

        - module_id      : filtrer par module
        - epic_id        : filtrer par epic
        - statut         : to_do | in_progress | done
        - priorite       : must_have | should_have | could_have | wont_have
        - non_planifiees : True → stories sans sprint (vrai backlog)
        - tri            : 'priorite' (MoSCoW) | 'points' | 'ordre' | 'statut'
        """
        q = self._query_projet(projet_id)

        if module_id:
            q = q.filter(Epic.module_id == module_id)
        if epic_id:
            q = q.filter(UserStory.epic_id == epic_id)
        if statut:
            q = q.filter(UserStory.statut == statut)
        if priorite:
            q = q.filter(UserStory.priorite == priorite)
        if non_planifiees:
            sous_requete = (
                self.db.query(sprint_userstory.c.userstory_id)
                .join(Sprint, sprint_userstory.c.sprint_id == Sprint.id)
                .filter(Sprint.projet_id == projet_id)
                .subquery()
            )
            q = q.filter(~UserStory.id.in_(self.db.query(sous_requete)))

        stories = q.options(joinedload(UserStory.epic)).all()

        # Tri en Python (MoSCoW ne peut pas être trié en SQL sans CASE)
        if tri == "priorite":
            stories.sort(key=lambda us: (ORDRE_MOSCOW.get(us.priorite, 99), us.ordre))
        elif tri == "points":
            stories.sort(key=lambda us: (us.points or 0), reverse=True)
        elif tri == "ordre":
            stories.sort(key=lambda us: us.ordre)
        elif tri == "statut":
            stories.sort(key=lambda us: us.statut or "")

        return stories

    # ── Indicateurs ─────────────────────────────────────────────────────────

    def get_indicateurs(self, projet_id: int) -> dict:
        """Agrégation story points par statut et par epic."""
        stories = self._query_projet(projet_id).options(joinedload(UserStory.epic)).all()

        total = len(stories)
        total_points = sum(us.points or 0 for us in stories)

        par_statut: dict = {}
        for us in stories:
            s = us.statut or "inconnu"
            if s not in par_statut:
                par_statut[s] = {"nb": 0, "points": 0}
            par_statut[s]["nb"] += 1
            par_statut[s]["points"] += us.points or 0

        par_epic: dict = {}
        for us in stories:
            key = us.epic_id
            label = us.epic.titre if us.epic else f"epic_{key}"
            if key not in par_epic:
                par_epic[key] = {"epic_id": key, "titre": label, "nb": 0, "points": 0, "points_done": 0}
            par_epic[key]["nb"] += 1
            par_epic[key]["points"] += us.points or 0
            if us.statut == "done":
                par_epic[key]["points_done"] += us.points or 0

        return {
            "projet_id": projet_id,
            "total_stories": total,
            "total_points": total_points,
            "points_done": par_statut.get("done", {}).get("points", 0),
            "par_statut": par_statut,
            "par_epic": list(par_epic.values()),
        }

    # ── Drag & drop (réordonnancement) ──────────────────────────────────────

    def reordonner(self, projet_id: int, ordre: List[int]) -> List[UserStory]:
        """
        Mettre à jour le champ `ordre` de chaque user story selon la liste d'IDs fournie.
        `ordre` = [us_id₁, us_id₂, …] dans le nouvel ordre souhaité.
        """
        stories = {
            us.id: us
            for us in self._query_projet(projet_id).all()
        }
        for position, us_id in enumerate(ordre):
            if us_id in stories:
                stories[us_id].ordre = position
        self.db.commit()
        return self.get_backlog(projet_id, tri="ordre")
