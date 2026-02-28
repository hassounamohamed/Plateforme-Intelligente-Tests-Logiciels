"""
Service métier pour la gestion des modules
"""
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from repositories.module_repository import ModuleRepository
from repositories.projet_repository import ProjetRepository
from schemas.module import CreateModuleRequest, UpdateModuleRequest, ReordonnerModulesRequest


class ModuleService:
    def __init__(self, db: Session):
        self.repo = ModuleRepository(db)
        self.projet_repo = ProjetRepository(db)

    # ── Helpers ────────────────────────────────────────────────────────────

    def _verifier_projet_et_ownership(self, projet_id: int, current_user_id: int):
        """Vérifie que le projet existe et que l'utilisateur en est le PO."""
        projet = self.projet_repo.get_by_id(projet_id)
        if not projet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Projet {projet_id} introuvable.",
            )
        if projet.productOwnerId != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seul le Product Owner du projet peut gérer ses modules.",
            )
        return projet

    def _verifier_projet(self, projet_id: int):
        """Vérifie que le projet existe."""
        projet = self.projet_repo.get_by_id(projet_id)
        if not projet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Projet {projet_id} introuvable.",
            )
        return projet

    def _get_module_ou_404(self, module_id: int, projet_id: int):
        module = self.repo.get_by_id_in_projet(module_id, projet_id)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Module {module_id} introuvable dans le projet {projet_id}.",
            )
        return module

    # ── Création ────────────────────────────────────────────────────────────

    def creer_module(
        self, projet_id: int, data: CreateModuleRequest, current_user_id: int
    ):
        """Créer un module dans un projet — réservé au Product Owner."""
        self._verifier_projet_et_ownership(projet_id, current_user_id)
        return self.repo.create(
            {
                "nom": data.nom,
                "description": data.description,
                "ordre": data.ordre if data.ordre is not None else 0,
                "projet_id": projet_id,
            }
        )

    # ── Lecture ─────────────────────────────────────────────────────────────

    def get_modules(self, projet_id: int) -> List:
        """Liste des modules d'un projet (ordonnés)."""
        self._verifier_projet(projet_id)
        return self.repo.get_by_projet(projet_id)

    def get_modules_avec_hierarchie(self, projet_id: int) -> List:
        """Modules avec leurs epics (hiérarchie complète)."""
        self._verifier_projet(projet_id)
        return self.repo.get_by_projet_with_hierarchy(projet_id)

    def get_module(self, projet_id: int, module_id: int):
        """Récupérer un module précis avec sa hiérarchie d'epics."""
        self._verifier_projet(projet_id)
        return self._get_module_ou_404(module_id, projet_id)

    # ── Modification ─────────────────────────────────────────────────────────

    def modifier_module(
        self,
        projet_id: int,
        module_id: int,
        data: UpdateModuleRequest,
        current_user_id: int,
    ):
        """Modifier un module — réservé au Product Owner."""
        self._verifier_projet_et_ownership(projet_id, current_user_id)
        self._get_module_ou_404(module_id, projet_id)
        return self.repo.update(module_id, data.model_dump(exclude_none=True))

    # ── Suppression ──────────────────────────────────────────────────────────

    def supprimer_module(
        self, projet_id: int, module_id: int, current_user_id: int
    ):
        """Supprimer un module (cascade sur les epics) — réservé au PO."""
        self._verifier_projet_et_ownership(projet_id, current_user_id)
        self._get_module_ou_404(module_id, projet_id)
        self.repo.delete(module_id)

    # ── Réordonnancement ─────────────────────────────────────────────────────

    def reordonner_modules(
        self,
        projet_id: int,
        data: ReordonnerModulesRequest,
        current_user_id: int,
    ) -> List:
        """Redéfinir l'ordre des modules — réservé au Product Owner."""
        self._verifier_projet_et_ownership(projet_id, current_user_id)
        return self.repo.reordonner(projet_id, data.ordre)
