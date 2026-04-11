"""
Service métier pour la gestion des sprints
"""
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from repositories.sprint_repository import SprintRepository, STATUTS_VALIDES
from repositories.projet_repository import ProjetRepository
from models.notification import TypeNotification
from services.notification_service import NotificationService
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
        self.notification_service = NotificationService(db)

    def _notify_sprint_related_users(
        self,
        sprint,
        notification_type: TypeNotification,
        titre: str,
        message: str,
        priorite: str = "moyenne",
        exclude_user_id: int | None = None,
    ):
        user_ids: set[int] = set()
        for us in sprint.userstories or []:
            if us.developerId:
                user_ids.add(us.developerId)
            if us.assigneeId:
                user_ids.add(us.assigneeId)
            if us.testerId:
                user_ids.add(us.testerId)

        if not user_ids:
            return

        self.notification_service.notify_users(
            user_ids=list(user_ids),
            titre=titre,
            message=message,
            notification_type=notification_type,
            priorite=priorite,
            exclude_user_id=exclude_user_id,
        )

    # ── Helpers ────────────────────────────────────────────────────────────

    def _verifier_projet(self, projet_id: int):
        projet = self.projet_repo.get_by_id(projet_id)
        print(f"[DEBUG] Verifying project {projet_id}: {projet}")
        if not projet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Projet {projet_id} introuvable.")
        return projet

    def _verifier_scrum_master(self, projet_id: int, current_user_id: int):
        """Pour le moment on vérifie juste que le projet existe.
        La restriction ROLE_SCRUM_MASTER est appliquée au niveau du décorateur de route."""
        return self._verifier_projet(projet_id)

    def _get_sprint_ou_404(self, sprint_id: int, projet_id: int):
        # First verify the sprint belongs to the project
        sprint = self.repo.get_by_id_in_projet(sprint_id, projet_id)
        print(f"[DEBUG] Looking for sprint {sprint_id} in project {projet_id}: {sprint}")
        if not sprint:
            # Check if sprint exists at all
            all_sprint = self.repo.get_by_id(sprint_id)
            if all_sprint:
                print(f"[DEBUG] Sprint {sprint_id} exists but belongs to project {all_sprint.projet_id}, not {projet_id}")
            else:
                print(f"[DEBUG] Sprint {sprint_id} does not exist in database")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Sprint {sprint_id} introuvable dans le projet {projet_id}.")
        # Then load it with userstories
        sprint_with_stories = self.repo.get_with_userstories(sprint_id)
        return sprint_with_stories

    # ── Création ────────────────────────────────────────────────────────────

    def creer_sprint(self, projet_id: int, data: CreateSprintRequest, current_user_id: int):
        projet = self._verifier_projet(projet_id)
        created = self.repo.create({
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
        target_ids = {m.id for m in (projet.membres or [])}
        if projet.productOwnerId:
            target_ids.add(projet.productOwnerId)
        self.notification_service.notify_users(
            user_ids=list(target_ids),
            titre=f"Nouveau sprint cree: {created.nom}",
            message=f"Le sprint {created.nom} a ete cree pour le projet {projet_id}.",
            notification_type=TypeNotification.SPRINT_CREATED,
            priorite="moyenne",
            exclude_user_id=current_user_id,
        )
        return created

    # ── Lecture ─────────────────────────────────────────────────────────────

    def get_sprints(self, projet_id: int) -> List:
        self._verifier_projet(projet_id)
        return self.repo.get_by_projet(projet_id)

    def get_sprint(self, projet_id: int, sprint_id: int):
        self._verifier_projet(projet_id)
        return self._get_sprint_ou_404(sprint_id, projet_id)

    def get_sprint_flexible(self, projet_id: int, sprint_id: int):
        """
        Récupère un sprint de manière flexible :
        - Si le sprint appartient au projet spécifié, le retourne
        - Sinon, retourne le sprint quel que soit son projet (pour compatibilité frontend)
        """
        # D'abord, essayer de récupérer le sprint directement
        sprint = self.repo.get_by_id(sprint_id)
        if not sprint:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Sprint {sprint_id} introuvable.")
        
        # Charger avec les user stories
        sprint_with_stories = self.repo.get_with_userstories(sprint_id)
        return sprint_with_stories

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

    def modifier_sprint_flexible(self, projet_id: int, sprint_id: int, data: UpdateSprintRequest, current_user_id: int):
        """Version flexible qui accepte n'importe quel projet_id"""
        sprint = self.repo.get_by_id(sprint_id)
        if not sprint:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Sprint {sprint_id} introuvable.")
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
        updated = self.repo.demarrer(sprint_id)
        if updated:
            sprint_with_stories = self.repo.get_with_userstories(updated.id)
            if sprint_with_stories:
                self._notify_sprint_related_users(
                    sprint=sprint_with_stories,
                    notification_type=TypeNotification.SPRINT_STARTED,
                    titre=f"Sprint demarre: {sprint_with_stories.nom}",
                    message=(
                        f"Le sprint {sprint_with_stories.nom} vient de demarrer pour le projet "
                        f"{sprint_with_stories.projet_id}."
                    ),
                    priorite="moyenne",
                    exclude_user_id=current_user_id,
                )
        return updated

    def demarrer_sprint_flexible(self, projet_id: int, sprint_id: int, current_user_id: int):
        """Version flexible qui accepte n'importe quel projet_id"""
        sprint = self.repo.get_by_id(sprint_id)
        if not sprint:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Sprint {sprint_id} introuvable.")
        if sprint.statut != "planifie":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail=f"Seul un sprint 'planifie' peut être démarré (statut actuel: {sprint.statut}).")
        # Utiliser le vrai projet_id du sprint pour vérifier
        if self.repo.get_actif(sprint.projet_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Un sprint est déjà en cours dans ce projet.")
        updated = self.repo.demarrer(sprint_id)
        if updated:
            sprint_with_stories = self.repo.get_with_userstories(updated.id)
            if sprint_with_stories:
                self._notify_sprint_related_users(
                    sprint=sprint_with_stories,
                    notification_type=TypeNotification.SPRINT_STARTED,
                    titre=f"Sprint demarre: {sprint_with_stories.nom}",
                    message=(
                        f"Le sprint {sprint_with_stories.nom} vient de demarrer pour le projet "
                        f"{sprint_with_stories.projet_id}."
                    ),
                    priorite="moyenne",
                    exclude_user_id=current_user_id,
                )
        return updated

    def cloturer_sprint(self, projet_id: int, sprint_id: int, current_user_id: int):
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        if sprint.statut != "en_cours":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail=f"Seul un sprint 'en_cours' peut être clôturé (statut actuel: {sprint.statut}).")
        updated = self.repo.cloturer(sprint_id)
        if updated:
            sprint_with_stories = self.repo.get_with_userstories(updated.id)
            if sprint_with_stories:
                self._notify_sprint_related_users(
                    sprint=sprint_with_stories,
                    notification_type=TypeNotification.SPRINT_COMPLETED,
                    titre=f"Sprint cloture: {sprint_with_stories.nom}",
                    message=(
                        f"Le sprint {sprint_with_stories.nom} est termine. "
                        f"Velocite: {sprint_with_stories.velocite}."
                    ),
                    priorite="moyenne",
                    exclude_user_id=current_user_id,
                )
        return updated

    def cloturer_sprint_flexible(self, projet_id: int, sprint_id: int, current_user_id: int):
        """Version flexible qui accepte n'importe quel projet_id"""
        sprint = self.repo.get_by_id(sprint_id)
        if not sprint:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Sprint {sprint_id} introuvable.")
        if sprint.statut != "en_cours":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail=f"Seul un sprint 'en_cours' peut être clôturé (statut actuel: {sprint.statut}).")
        updated = self.repo.cloturer(sprint_id)
        if updated:
            sprint_with_stories = self.repo.get_with_userstories(updated.id)
            if sprint_with_stories:
                self._notify_sprint_related_users(
                    sprint=sprint_with_stories,
                    notification_type=TypeNotification.SPRINT_COMPLETED,
                    titre=f"Sprint cloture: {sprint_with_stories.nom}",
                    message=(
                        f"Le sprint {sprint_with_stories.nom} est termine. "
                        f"Velocite: {sprint_with_stories.velocite}."
                    ),
                    priorite="moyenne",
                    exclude_user_id=current_user_id,
                )
        return updated

    # ── User Stories ─────────────────────────────────────────────────────────

    def ajouter_userstories(self, projet_id: int, sprint_id: int, data: AjouterUserStoriesRequest, current_user_id: int):
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        if sprint.statut == "termine":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Impossible d'ajouter des stories à un sprint terminé.")
        before_ids = {us.id for us in sprint.userstories or []}
        updated = self.repo.ajouter_userstories(sprint_id, data.userstory_ids)
        if updated:
            added_stories = [us for us in updated.userstories if us.id not in before_ids]
            target_ids: set[int] = set()
            for us in added_stories:
                if us.developerId:
                    target_ids.add(us.developerId)
                if us.assigneeId:
                    target_ids.add(us.assigneeId)
                if us.testerId:
                    target_ids.add(us.testerId)
            if target_ids:
                self.notification_service.notify_users(
                    user_ids=list(target_ids),
                    titre="Nouvelle story planifiee",
                    message=f"Une user story vous concernant a ete ajoutee au sprint {updated.nom}.",
                    notification_type=TypeNotification.USER_STORY_ADDED_TO_SPRINT,
                    priorite="moyenne",
                    exclude_user_id=current_user_id,
                )
        return updated

    def ajouter_userstories_flexible(self, projet_id: int, sprint_id: int, data: AjouterUserStoriesRequest, current_user_id: int):
        """Version flexible qui accepte n'importe quel projet_id"""
        sprint = self.repo.get_by_id(sprint_id)
        if not sprint:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Sprint {sprint_id} introuvable.")
        if sprint.statut == "termine":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Impossible d'ajouter des stories à un sprint terminé.")
        sprint_with_stories = self.repo.get_with_userstories(sprint_id)
        before_ids = {us.id for us in (sprint_with_stories.userstories if sprint_with_stories else [])}
        updated = self.repo.ajouter_userstories(sprint_id, data.userstory_ids)
        if updated:
            added_stories = [us for us in updated.userstories if us.id not in before_ids]
            target_ids: set[int] = set()
            for us in added_stories:
                if us.developerId:
                    target_ids.add(us.developerId)
                if us.assigneeId:
                    target_ids.add(us.assigneeId)
                if us.testerId:
                    target_ids.add(us.testerId)
            if target_ids:
                self.notification_service.notify_users(
                    user_ids=list(target_ids),
                    titre="Nouvelle story planifiee",
                    message=f"Une user story vous concernant a ete ajoutee au sprint {updated.nom}.",
                    notification_type=TypeNotification.USER_STORY_ADDED_TO_SPRINT,
                    priorite="moyenne",
                    exclude_user_id=current_user_id,
                )
        return updated

    def retirer_userstories(self, projet_id: int, sprint_id: int, data: RetirerUserStoriesRequest, current_user_id: int):
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        if sprint.statut == "termine":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Impossible de retirer des stories d'un sprint terminé.")
        removed_stories = [us for us in sprint.userstories if us.id in set(data.userstory_ids)]
        updated = self.repo.retirer_userstories(sprint_id, data.userstory_ids)
        target_ids: set[int] = set()
        for us in removed_stories:
            if us.developerId:
                target_ids.add(us.developerId)
            if us.assigneeId:
                target_ids.add(us.assigneeId)
            if us.testerId:
                target_ids.add(us.testerId)
        if target_ids and updated:
            self.notification_service.notify_users(
                user_ids=list(target_ids),
                titre="Story retiree du sprint",
                message=f"Une user story vous concernant a ete retiree du sprint {updated.nom}.",
                notification_type=TypeNotification.USER_STORY_REMOVED_FROM_SPRINT,
                priorite="basse",
                exclude_user_id=current_user_id,
            )
        return updated

    def retirer_userstories_flexible(self, projet_id: int, sprint_id: int, data: RetirerUserStoriesRequest, current_user_id: int):
        """Version flexible qui accepte n'importe quel projet_id"""
        sprint = self.repo.get_by_id(sprint_id)
        if not sprint:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Sprint {sprint_id} introuvable.")
        if sprint.statut == "termine":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Impossible de retirer des stories d'un sprint terminé.")
        sprint_with_stories = self.repo.get_with_userstories(sprint_id)
        removed_stories = [
            us for us in (sprint_with_stories.userstories if sprint_with_stories else [])
            if us.id in set(data.userstory_ids)
        ]
        updated = self.repo.retirer_userstories(sprint_id, data.userstory_ids)
        target_ids: set[int] = set()
        for us in removed_stories:
            if us.developerId:
                target_ids.add(us.developerId)
            if us.assigneeId:
                target_ids.add(us.assigneeId)
            if us.testerId:
                target_ids.add(us.testerId)
        if target_ids and updated:
            self.notification_service.notify_users(
                user_ids=list(target_ids),
                titre="Story retiree du sprint",
                message=f"Une user story vous concernant a ete retiree du sprint {updated.nom}.",
                notification_type=TypeNotification.USER_STORY_REMOVED_FROM_SPRINT,
                priorite="basse",
                exclude_user_id=current_user_id,
            )
        return updated

    # ── Vélocité ─────────────────────────────────────────────────────────────

    def calculer_velocite(self, projet_id: int, sprint_id: int):
        self._get_sprint_ou_404(sprint_id, projet_id)
        return self.repo.calculer_velocite(sprint_id)

    def calculer_velocite_flexible(self, projet_id: int, sprint_id: int):
        """Version flexible qui accepte n'importe quel projet_id"""
        sprint = self.repo.get_by_id(sprint_id)
        if not sprint:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Sprint {sprint_id} introuvable.")
        return self.repo.calculer_velocite(sprint_id)

    # ── Suppression ──────────────────────────────────────────────────────────

    def supprimer_sprint(self, projet_id: int, sprint_id: int, current_user_id: int):
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        if sprint.statut != "planifie":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Seul un sprint 'planifie' peut être supprimé.")
        self.repo.delete(sprint_id)

    def supprimer_sprint_flexible(self, projet_id: int, sprint_id: int, current_user_id: int):
        """Version flexible qui accepte n'importe quel projet_id"""
        sprint = self.repo.get_by_id(sprint_id)
        if not sprint:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Sprint {sprint_id} introuvable.")
        if sprint.statut != "planifie":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Seul un sprint 'planifie' peut être supprimé.")
        self.repo.delete(sprint_id)
