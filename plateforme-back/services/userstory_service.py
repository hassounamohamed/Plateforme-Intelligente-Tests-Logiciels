"""
Service métier pour la gestion des User Stories
"""
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from repositories.scrum_repository import UserStoryRepository
from repositories.epic_repository import EpicRepository
from repositories.module_repository import ModuleRepository
from repositories.projet_repository import ProjetRepository
from schemas.userstory import (
    CreateUserStoryRequest,
    UpdateUserStoryRequest,
    ChangerStatutUSRequest,
    AssignerDeveloppeurRequest,
    STORY_POINTS_VALIDES,
)


def _assembler_description(role: str, action: str, benefice: Optional[str]) -> str:
    """Construit la phrase 'En tant que / je veux / afin de'."""
    base = f"En tant que {role}, je veux {action}"
    if benefice:
        base += f", afin de {benefice}"
    return base + "."


class UserStoryService:
    def __init__(self, db: Session):
        self.repo = UserStoryRepository(db)
        self.epic_repo = EpicRepository(db)
        self.module_repo = ModuleRepository(db)
        self.projet_repo = ProjetRepository(db)

    # ── Helpers ────────────────────────────────────────────────────────────

    def _verifier_projet(self, projet_id: int):
        projet = self.projet_repo.get_by_id(projet_id)
        if not projet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Projet {projet_id} introuvable.")
        return projet

    def _verifier_module(self, module_id: int, projet_id: int):
        module = self.module_repo.get_by_id_in_projet(module_id, projet_id)
        if not module:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Module {module_id} introuvable dans le projet {projet_id}.")
        return module

    def _verifier_epic(self, epic_id: int, module_id: int):
        epic = self.epic_repo.get_by_id_in_module(epic_id, module_id)
        if not epic:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Epic {epic_id} introuvable dans le module {module_id}.")
        return epic

    def _verifier_po(self, projet_id: int, current_user_id: int):
        projet = self._verifier_projet(projet_id)
        if projet.productOwnerId != current_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="Seul le Product Owner peut effectuer cette action.")
        return projet

    def _get_us_ou_404(self, us_id: int, epic_id: int):
        us = self.repo.get_by_id(us_id)
        if not us or us.epic_id != epic_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"User story {us_id} introuvable dans l'epic {epic_id}.")
        return us

    def _valider_points(self, points: Optional[int]):
        if points is not None and points not in STORY_POINTS_VALIDES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Story points invalides. Valeurs Fibonacci acceptées : {sorted(STORY_POINTS_VALIDES)}",
            )

    # ── Création ────────────────────────────────────────────────────────────

    def creer_user_story(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        data: CreateUserStoryRequest,
        current_user_id: int,
    ):
        """Décomposer un epic en user story — Scrum Master ou Product Owner."""
        self._verifier_module(module_id, projet_id)
        self._verifier_epic(epic_id, module_id)
        self._valider_points(data.points)

        description = _assembler_description(data.role, data.action, data.benefice)

        return self.repo.create({
            "titre": data.titre,
            "description": description,
            "criteresAcceptation": data.criteresAcceptation,
            "points": data.points,
            "priorite": data.priorite,
            "statut": "to_do",
            "epic_id": epic_id,
            "developerId": None,
        })

    # ── Lecture ─────────────────────────────────────────────────────────────

    def get_user_stories(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        statut: Optional[str] = None,
    ) -> List:
        self._verifier_module(module_id, projet_id)
        self._verifier_epic(epic_id, module_id)
        stories = self.repo.get_by_epic(epic_id)
        if statut:
            stories = [us for us in stories if us.statut == statut]
        # Tri MoSCoW : must_have > should_have > could_have > wont_have
        ordre = {"must_have": 0, "should_have": 1, "could_have": 2, "wont_have": 3}
        stories.sort(key=lambda us: ordre.get(us.priorite, 99))
        return stories

    def get_user_story(self, projet_id: int, module_id: int, epic_id: int, us_id: int):
        self._verifier_module(module_id, projet_id)
        self._verifier_epic(epic_id, module_id)
        return self._get_us_ou_404(us_id, epic_id)

    def get_backlog(self, projet_id: int, module_id: int, epic_id: int):
        """User stories non encore affectées à un sprint."""
        self._verifier_module(module_id, projet_id)
        self._verifier_epic(epic_id, module_id)
        return self.repo.get_backlog(epic_id)

    # ── Modification ─────────────────────────────────────────────────────────

    def modifier_user_story(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        us_id: int,
        data: UpdateUserStoryRequest,
        current_user_id: int,
    ):
        self._verifier_module(module_id, projet_id)
        self._verifier_epic(epic_id, module_id)
        us = self._get_us_ou_404(us_id, epic_id)
        self._valider_points(data.points)

        fields = data.model_dump(exclude_none=True)

        # Reassembler la description si au moins un des champs narratifs est fourni
        role = fields.pop("role", None)
        action = fields.pop("action", None)
        benefice = fields.pop("benefice", None)
        if role or action or benefice:
            # Partir de la description existante si champ manquant
            import re
            current = us.description or ""
            def extract(pattern, text):
                m = re.search(pattern, text)
                return m.group(1).strip() if m else ""

            effective_role = role or extract(r"En tant que (.+?),", current)
            effective_action = action or extract(r"je veux (.+?)(?:, afin|\.)", current)
            effective_benefice = benefice or extract(r"afin de (.+?)\.", current) or None
            fields["description"] = _assembler_description(
                effective_role, effective_action, effective_benefice
            )

        return self.repo.update(us_id, fields)

    # ── Statut ───────────────────────────────────────────────────────────────

    def changer_statut(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        us_id: int,
        data: ChangerStatutUSRequest,
        current_user_id: int,
    ):
        self._verifier_module(module_id, projet_id)
        self._verifier_epic(epic_id, module_id)
        self._get_us_ou_404(us_id, epic_id)
        return self.repo.update(us_id, {"statut": data.statut})

    # ── Assigner développeur ─────────────────────────────────────────────────

    def assigner_developpeur(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        us_id: int,
        data: AssignerDeveloppeurRequest,
        current_user_id: int,
    ):
        """Assigner un développeur à une user story — Scrum Master uniquement."""
        self._verifier_module(module_id, projet_id)
        self._verifier_epic(epic_id, module_id)
        self._get_us_ou_404(us_id, epic_id)
        return self.repo.update(us_id, {"developerId": data.developeur_id})

    # ── Valider ──────────────────────────────────────────────────────────────

    def valider_user_story(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        us_id: int,
        current_user_id: int,
    ):
        """Marquer la user story comme 'done' — Product Owner uniquement."""
        self._verifier_po(projet_id, current_user_id)
        self._verifier_module(module_id, projet_id)
        self._verifier_epic(epic_id, module_id)
        self._get_us_ou_404(us_id, epic_id)
        return self.repo.update(us_id, {"statut": "done"})

    # ── Suppression ──────────────────────────────────────────────────────────

    def supprimer_user_story(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        us_id: int,
        current_user_id: int,
    ):
        self._verifier_module(module_id, projet_id)
        self._verifier_epic(epic_id, module_id)
        self._get_us_ou_404(us_id, epic_id)
        self.repo.delete(us_id)
