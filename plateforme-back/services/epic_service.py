"""
Service métier pour la gestion des epics
"""
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from repositories.epic_repository import EpicRepository, STATUTS_VALIDES
from repositories.module_repository import ModuleRepository
from repositories.projet_repository import ProjetRepository
from schemas.epic import (
    CreateEpicRequest,
    UpdateEpicRequest,
    ChangerStatutRequest,
    ChangerPrioriteRequest,
)


class EpicService:
    def __init__(self, db: Session):
        self.repo = EpicRepository(db)
        self.module_repo = ModuleRepository(db)
        self.projet_repo = ProjetRepository(db)

    # ── Helpers ────────────────────────────────────────────────────────────

    def _verifier_module(self, module_id: int, projet_id: int):
        """Vérifie que le module existe et appartient bien au projet."""
        module = self.module_repo.get_by_id_in_projet(module_id, projet_id)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Module {module_id} introuvable dans le projet {projet_id}.",
            )
        return module

    def _verifier_ownership(self, projet_id: int, current_user_id: int):
        """Vérifie que l'utilisateur est le PO du projet."""
        projet = self.projet_repo.get_by_id(projet_id)
        if not projet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Projet {projet_id} introuvable.",
            )
        if projet.productOwnerId != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seul le Product Owner du projet peut gérer ses epics.",
            )
        return projet

    def _get_epic_ou_404(self, epic_id: int, module_id: int):
        epic = self.repo.get_by_id_in_module(epic_id, module_id)
        if not epic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Epic {epic_id} introuvable dans le module {module_id}.",
            )
        return epic

    # ── Création ────────────────────────────────────────────────────────────

    def creer_epic(
        self,
        projet_id: int,
        module_id: int,
        data: CreateEpicRequest,
        current_user_id: int,
    ):
        """Créer un epic dans un module — Product Owner uniquement."""
        self._verifier_ownership(projet_id, current_user_id)
        self._verifier_module(module_id, projet_id)
        return self.repo.create(
            {
                "titre": data.titre,
                "description": data.description,
                "priorite": data.priorite,
                "businessValue": data.businessValue,
                "statut": data.statut,
                "module_id": module_id,
                "productOwnerId": current_user_id,
            }
        )

    # ── Lecture ─────────────────────────────────────────────────────────────

    def get_epics(self, projet_id: int, module_id: int, statut: Optional[str] = None):
        """Liste des epics d'un module, triés par priorité (optionnellement filtrés)."""
        self._verifier_module(module_id, projet_id)
        if statut:
            if statut not in STATUTS_VALIDES:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Statut invalide. Valeurs acceptées : {', '.join(STATUTS_VALIDES)}",
                )
            return self.repo.get_by_statut(module_id, statut)
        return self.repo.get_by_module_with_userstories(module_id)

    def get_epic(self, projet_id: int, module_id: int, epic_id: int):
        """Récupérer un epic avec ses user-stories."""
        self._verifier_module(module_id, projet_id)
        return self._get_epic_ou_404(epic_id, module_id)

    def get_progression(self, projet_id: int, module_id: int, epic_id: int):
        """Calculer la progression d'un epic."""
        self._verifier_module(module_id, projet_id)
        epic = self._get_epic_ou_404(epic_id, module_id)
        stats = self.repo.calculer_progression(epic_id)
        return {
            "epic_id": epic.id,
            "titre": epic.titre,
            "statut": epic.statut,
            "total_userstories": stats["total"],
            "userstories_terminees": stats["terminees"],
            "pourcentage_completion": stats["pourcentage"],
        }

    # ── Modification ─────────────────────────────────────────────────────────

    def modifier_epic(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        data: UpdateEpicRequest,
        current_user_id: int,
    ):
        """Modifier les champs d'un epic — Product Owner uniquement."""
        self._verifier_ownership(projet_id, current_user_id)
        self._verifier_module(module_id, projet_id)
        self._get_epic_ou_404(epic_id, module_id)
        return self.repo.update(epic_id, data.model_dump(exclude_none=True))

    # ── Changement de statut ─────────────────────────────────────────────────

    def changer_statut(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        data: ChangerStatutRequest,
        current_user_id: int,
    ):
        """Faire avancer l'epic dans le workflow To Do → In Progress → Done."""
        self._verifier_ownership(projet_id, current_user_id)
        self._verifier_module(module_id, projet_id)
        self._get_epic_ou_404(epic_id, module_id)
        return self.repo.changer_statut(epic_id, data.statut)

    # ── Priorisation ─────────────────────────────────────────────────────────

    def changer_priorite(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        data: ChangerPrioriteRequest,
        current_user_id: int,
    ):
        """Modifier la priorité d'un epic — Product Owner uniquement."""
        self._verifier_ownership(projet_id, current_user_id)
        self._verifier_module(module_id, projet_id)
        self._get_epic_ou_404(epic_id, module_id)
        return self.repo.changer_priorite(epic_id, data.priorite)

    # ── Suppression ──────────────────────────────────────────────────────────

    def supprimer_epic(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        current_user_id: int,
    ):
        """Supprimer un epic (cascade sur les user-stories) — PO uniquement."""
        self._verifier_ownership(projet_id, current_user_id)
        self._verifier_module(module_id, projet_id)
        self._get_epic_ou_404(epic_id, module_id)
        self.repo.delete(epic_id)
