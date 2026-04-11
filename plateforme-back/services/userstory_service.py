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
from models.notification import TypeNotification
from services.notification_service import NotificationService
from schemas.userstory import (
    CreateUserStoryRequest,
    UpdateUserStoryRequest,
    ChangerStatutUSRequest,
    AssignerDeveloppeurRequest,
    AssignerTesteurRequest,
    AssignerAssigneeRequest,
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
        self.db = db
        self.repo = UserStoryRepository(db)
        self.epic_repo = EpicRepository(db)
        self.module_repo = ModuleRepository(db)
        self.projet_repo = ProjetRepository(db)
        self.notification_service = NotificationService(db)

    def _related_user_ids(self, us) -> set[int]:
        ids: set[int] = set()
        for field in ("developerId", "testerId", "assigneeId"):
            value = getattr(us, field, None)
            if value:
                ids.add(value)
        return ids

    def _us_ref(self, us) -> str:
        return us.reference or f"US-{us.id}"

    def _notify_assignment(self, us, user_id: int, role_label: str):
        self.notification_service.notify_user(
            user_id=user_id,
            titre=f"Affectation {role_label}",
            message=(
                f"La user story {self._us_ref(us)} ({us.titre}) vous a ete affectee "
                f"en tant que {role_label}."
            ),
            notification_type=TypeNotification.USER_STORY_ASSIGNED_TO_ME,
            priorite="moyenne",
        )

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

    def _verifier_membre_projet(self, projet_id: int, user_id: int):
        """Vérifier que l'utilisateur est membre (ou Product Owner) du projet."""
        from models.user import Utilisateur
        projet = self._verifier_projet(projet_id)
        est_po = projet.productOwnerId == user_id
        est_membre = any(m.id == user_id for m in projet.membres)
        if not est_po and not est_membre:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"L'utilisateur {user_id} n'est pas membre du projet {projet_id}.",
            )
        user = self.db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Utilisateur {user_id} introuvable.")
        return user

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
        projet = self._verifier_projet(projet_id)
        self._verifier_module(module_id, projet_id)
        self._verifier_epic(epic_id, module_id)
        self._valider_points(data.points)

        description = _assembler_description(data.role, data.action, data.benefice)

        # Incrémenter le compteur global du projet pour obtenir la référence
        numero = self.projet_repo.next_issue_number(projet_id)
        reference = f"{projet.key}-{numero}"

        created = self.repo.create({
            "reference": reference,
            "titre": data.titre,
            "description": description,
            "criteresAcceptation": data.criteresAcceptation,
            "points": data.points,
            "duree_estimee": data.duree_estimee,
            "start_date": data.start_date,
            "due_date": data.due_date,
            "priorite": data.priorite,
            "statut": "to_do",
            "epic_id": epic_id,
            "developerId": None,
            "assigneeId": self._valider_assignee_optionnel(projet_id, data.assignee_id),
        })

        self.notification_service.notify_users(
            user_ids=list(self._related_user_ids(created)),
            titre="Nouvelle user story creee",
            message=f"La user story {self._us_ref(created)} ({created.titre}) a ete creee.",
            notification_type=TypeNotification.USER_STORY_CREATED,
            priorite="moyenne",
            exclude_user_id=current_user_id,
        )
        return created

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

        # Traiter assignee_id séparément (peut être explicitement None pour retirer l'assignee)
        if "assignee_id" in data.model_fields_set:
            fields["assigneeId"] = self._valider_assignee_optionnel(projet_id, data.assignee_id)
            fields.pop("assignee_id", None)
        else:
            fields.pop("assignee_id", None)

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

        updated = self.repo.update(us_id, fields)
        if updated and fields:
            self.notification_service.notify_users(
                user_ids=list(self._related_user_ids(updated)),
                titre="User story mise a jour",
                message=f"La user story {self._us_ref(updated)} ({updated.titre}) a ete modifiee.",
                notification_type=TypeNotification.USER_STORY_UPDATED,
                priorite="basse",
                exclude_user_id=current_user_id,
            )
        return updated

    # ── Assigner assignee ─────────────────────────────────────────────────────

    def assigner_assignee(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        us_id: int,
        data: AssignerAssigneeRequest,
        current_user_id: int,
    ):
        """Désigner le responsable (assignee) d'une user story — doit être membre du projet."""
        self._verifier_module(module_id, projet_id)
        self._verifier_epic(epic_id, module_id)
        us = self._get_us_ou_404(us_id, epic_id)
        previous_assignee_id = us.assigneeId
        self._verifier_membre_projet(projet_id, data.assignee_id)
        updated = self.repo.update(us_id, {"assigneeId": data.assignee_id})
        if updated and data.assignee_id != previous_assignee_id:
            self._notify_assignment(updated, data.assignee_id, "responsable")
        return updated

    def retirer_assignee(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        us_id: int,
        current_user_id: int,
    ):
        """Retirer l'assignee d'une user story."""
        self._verifier_module(module_id, projet_id)
        self._verifier_epic(epic_id, module_id)
        us = self._get_us_ou_404(us_id, epic_id)
        previous_assignee_id = us.assigneeId
        updated = self.repo.update(us_id, {"assigneeId": None})
        if previous_assignee_id:
            self.notification_service.notify_user(
                user_id=previous_assignee_id,
                titre="Retrait d'affectation",
                message=(
                    f"Vous n'etes plus responsable de la user story {self._us_ref(us)} "
                    f"({us.titre})."
                ),
                notification_type=TypeNotification.USER_STORY_UPDATED,
                priorite="basse",
            )
        return updated

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
        us = self._get_us_ou_404(us_id, epic_id)
        old_status = us.statut
        updated = self.repo.update(us_id, {"statut": data.statut})
        if updated and old_status != data.statut:
            related_ids = self._related_user_ids(updated)
            self.notification_service.notify_users(
                user_ids=list(related_ids),
                titre="Mise a jour de statut",
                message=(
                    f"La user story {self._us_ref(updated)} ({updated.titre}) est passee de "
                    f"{old_status} a {data.statut}."
                ),
                notification_type=TypeNotification.USER_STORY_UPDATED,
                priorite="moyenne",
                exclude_user_id=current_user_id,
            )
        return updated

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
        us = self._get_us_ou_404(us_id, epic_id)
        previous_developer_id = us.developerId
        updated = self.repo.update(us_id, {"developerId": data.developeur_id})
        if updated and data.developeur_id != previous_developer_id:
            self._notify_assignment(updated, data.developeur_id, "developpeur")
        return updated

    def assigner_testeur(
        self,
        projet_id: int,
        module_id: int,
        epic_id: int,
        us_id: int,
        data: AssignerTesteurRequest,
        current_user_id: int,
    ):
        """Assigner un testeur QA à une user story — Scrum Master uniquement."""
        from models.user import Utilisateur
        from core.rbac.constants import ROLE_TESTEUR_QA
        self._verifier_module(module_id, projet_id)
        self._verifier_epic(epic_id, module_id)
        us = self._get_us_ou_404(us_id, epic_id)
        # Vérifier que l'utilisateur assigné a bien le rôle TESTEUR_QA
        testeur = self.db.query(Utilisateur).filter(Utilisateur.id == data.testeur_id).first()
        if not testeur:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Utilisateur {data.testeur_id} introuvable.")
        if not testeur.role or testeur.role.code != ROLE_TESTEUR_QA:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                detail="L'utilisateur assigné doit avoir le rôle TESTEUR_QA.")
        previous_tester_id = us.testerId
        updated = self.repo.update(us_id, {"testerId": data.testeur_id})
        if updated and data.testeur_id != previous_tester_id:
            self._notify_assignment(updated, data.testeur_id, "testeur")
        return updated

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
        us = self._get_us_ou_404(us_id, epic_id)
        updated = self.repo.update(us_id, {"statut": "done"})
        if updated:
            self.notification_service.notify_users(
                user_ids=list(self._related_user_ids(updated)),
                titre="User story validee",
                message=(
                    f"La user story {self._us_ref(updated)} ({updated.titre}) a ete validee "
                    "et marquee done."
                ),
                notification_type=TypeNotification.USER_STORY_VALIDATED,
                priorite="moyenne",
                exclude_user_id=current_user_id,
            )
        return updated

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
        us = self._get_us_ou_404(us_id, epic_id)
        related_ids = list(self._related_user_ids(us))
        self.repo.delete(us_id)
        self.notification_service.notify_users(
            user_ids=related_ids,
            titre="User story supprimee",
            message=f"La user story {self._us_ref(us)} ({us.titre}) a ete supprimee.",
            notification_type=TypeNotification.USER_STORY_DELETED,
            priorite="moyenne",
            exclude_user_id=current_user_id,
        )
