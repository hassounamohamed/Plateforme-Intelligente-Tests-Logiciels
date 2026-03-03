"""
Service métier pour la gestion des sprints
"""
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from repositories.sprint_repository import SprintRepository, STATUTS_VALIDES
from repositories.projet_repository import ProjetRepository
from schemas.sprint import (
    CreateSprintRequest,
    UpdateSprintRequest,
    AjouterUserStoriesRequest,
    RetirerUserStoriesRequest,
)


class SprintService:
    def __init__(self, db: Session):
        self.repo = SprintRepository(db)
        self.projet_repo = ProjetRepository(db)

    # ── Helpers ────────────────────────────────────────────────────────────

    def _verifier_projet(self, projet_id: int):
        projet = self.projet_repo.get_by_id(projet_id)
        if not projet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Projet {projet_id} introuvable.")
        return projet

    def _verifier_scrum_master(self, projet_id: int, current_user_id: int):
        """Pour le moment on vérifie juste que le projet existe.
        La restriction ROLE_SCRUM_MASTER est appliquée au niveau du décorateur de route."""
        return self._verifier_projet(projet_id)

    def _get_sprint_ou_404(self, sprint_id: int, projet_id: int):
        sprint = self.repo.get_by_id_in_projet(sprint_id, projet_id)
        if not sprint:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Sprint {sprint_id} introuvable dans le projet {projet_id}.")
        return sprint

    # ── Création ────────────────────────────────────────────────────────────

    def creer_sprint(self, projet_id: int, data: CreateSprintRequest, current_user_id: int):
        self._verifier_projet(projet_id)
        return self.repo.create({
            "nom": data.nom,
            "objectifSprint": data.objectifSprint,
            "dateDebut": data.dateDebut,
            "dateFin": data.dateFin,
            "capaciteEquipe": data.capaciteEquipe,
            "velocite": 0,
            "statut": "planifie",
            "projet_id": projet_id,
            "scrumMasterId": current_user_id,
        })

    # ── Lecture ─────────────────────────────────────────────────────────────

    def get_sprints(self, projet_id: int) -> List:
        self._verifier_projet(projet_id)
        return self.repo.get_by_projet(projet_id)

    def get_sprint(self, projet_id: int, sprint_id: int):
        self._verifier_projet(projet_id)
        return self._get_sprint_ou_404(sprint_id, projet_id)

    def get_sprint_actif(self, projet_id: int):
        self._verifier_projet(projet_id)
        return self.repo.get_actif(projet_id)

    # ── Modification ─────────────────────────────────────────────────────────

    def modifier_sprint(self, projet_id: int, sprint_id: int, data: UpdateSprintRequest, current_user_id: int):
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        if sprint.statut == "termine":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Un sprint terminé ne peut plus être modifié.")
        return self.repo.update(sprint_id, data.model_dump(exclude_none=True))

    # ── Cycle de vie ─────────────────────────────────────────────────────────

    def demarrer_sprint(self, projet_id: int, sprint_id: int, current_user_id: int):
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        if sprint.statut != "planifie":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail=f"Seul un sprint 'planifie' peut être démarré (statut actuel: {sprint.statut}).")
        # Un seul sprint actif par projet
        if self.repo.get_actif(projet_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Un sprint est déjà en cours dans ce projet.")
        return self.repo.demarrer(sprint_id)

    def cloturer_sprint(self, projet_id: int, sprint_id: int, current_user_id: int):
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        if sprint.statut != "en_cours":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail=f"Seul un sprint 'en_cours' peut être clôturé (statut actuel: {sprint.statut}).")
        return self.repo.cloturer(sprint_id)

    # ── User Stories ─────────────────────────────────────────────────────────

    def ajouter_userstories(self, projet_id: int, sprint_id: int, data: AjouterUserStoriesRequest, current_user_id: int):
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        if sprint.statut == "termine":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Impossible d'ajouter des stories à un sprint terminé.")
        return self.repo.ajouter_userstories(sprint_id, data.userstory_ids)

    def retirer_userstories(self, projet_id: int, sprint_id: int, data: RetirerUserStoriesRequest, current_user_id: int):
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        if sprint.statut == "termine":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Impossible de retirer des stories d'un sprint terminé.")
        return self.repo.retirer_userstories(sprint_id, data.userstory_ids)

    # ── Vélocité ─────────────────────────────────────────────────────────────

    def calculer_velocite(self, projet_id: int, sprint_id: int):
        self._get_sprint_ou_404(sprint_id, projet_id)
        return self.repo.calculer_velocite(sprint_id)

    # ── Suppression ──────────────────────────────────────────────────────────

    def supprimer_sprint(self, projet_id: int, sprint_id: int, current_user_id: int):
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        if sprint.statut != "planifie":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Seul un sprint 'planifie' peut être supprimé.")
        self.repo.delete(sprint_id)
