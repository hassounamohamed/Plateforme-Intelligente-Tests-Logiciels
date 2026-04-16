"""
Service métier pour la gestion des sprints
"""
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from repositories.sprint_repository import SprintRepository, STATUTS_VALIDES
from repositories.projet_repository import ProjetRepository
from models.scrum import UserStory, Epic, Module
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

    def _notify_sprint_project_users(
        self,
        project_id: int,
        notification_type: TypeNotification,
        titre: str,
        message: str,
        priorite: str = "moyenne",
        exclude_user_id: int | None = None,
    ):
        self.notification_service.notify_project_users(
            project_id=project_id,
            titre=titre,
            message=message,
            notification_type=notification_type,
            priorite=priorite,
            exclude_user_id=exclude_user_id,
        )

    def _build_project_us_number_map(self, projet_id: int) -> dict[int, int]:
        rows = (
            self.repo.db.query(UserStory.id)
            .join(Epic, UserStory.epic_id == Epic.id)
            .join(Module, Epic.module_id == Module.id)
            .filter(Module.projet_id == projet_id)
            .order_by(UserStory.id.asc())
            .all()
        )
        return {us_id: idx + 1 for idx, (us_id,) in enumerate(rows)}

    def _project_reference_prefix(self, projet_id: int) -> str:
        projet = self.projet_repo.get_by_id(projet_id)
        return (projet.key if projet and projet.key else "US").upper()

    def _apply_reference_to_sprint(self, sprint, projet_id: Optional[int] = None):
        if not sprint:
            return sprint
        effective_projet_id = projet_id or sprint.projet_id
        if not effective_projet_id:
            return sprint
        mapping = self._build_project_us_number_map(effective_projet_id)
        prefix = self._project_reference_prefix(effective_projet_id)
        for us in sprint.userstories or []:
            numero = mapping.get(us.id)
            if numero is not None:
                us.reference = f"{prefix}-{numero}"
        return sprint

    def _apply_reference_to_sprints(self, sprints: List, projet_id: int) -> List:
        mapping = self._build_project_us_number_map(projet_id)
        prefix = self._project_reference_prefix(projet_id)
        for sprint in sprints:
            for us in sprint.userstories or []:
                numero = mapping.get(us.id)
                if numero is not None:
                    us.reference = f"{prefix}-{numero}"
        return sprints

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
        self.notification_service.notify_project_users(
            project_id=projet_id,
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
        sprints = self.repo.get_by_projet(projet_id)
        return self._apply_reference_to_sprints(sprints, projet_id)

    def get_sprint(self, projet_id: int, sprint_id: int):
        self._verifier_projet(projet_id)
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        return self._apply_reference_to_sprint(sprint, projet_id)

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
        return self._apply_reference_to_sprint(sprint_with_stories, sprint.projet_id)

    def get_sprint_actif(self, projet_id: int):
        self._verifier_projet(projet_id)
        sprint = self.repo.get_actif(projet_id)
        if sprint:
            sprint = self.repo.get_with_userstories(sprint.id) or sprint
        return self._apply_reference_to_sprint(sprint, projet_id)

    # ── Modification ─────────────────────────────────────────────────────────

    def modifier_sprint(self, projet_id: int, sprint_id: int, data: UpdateSprintRequest, current_user_id: int):
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        if sprint.statut == "termine":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Un sprint terminé ne peut plus être modifié.")
        updated = self.repo.update(sprint_id, data.model_dump(exclude_none=True))
        if updated:
            self._notify_sprint_project_users(
                project_id=projet_id,
                notification_type=TypeNotification.BACKLOG_UPDATED,
                titre=f"Sprint mis a jour: {updated.nom}",
                message=f"Le sprint {updated.nom} a ete modifie.",
                priorite="moyenne",
                exclude_user_id=current_user_id,
            )
            if updated.dateFin and updated.statut != "termine":
                remaining_seconds = (updated.dateFin - datetime.utcnow()).total_seconds()
                if 0 < remaining_seconds <= 3 * 24 * 3600:
                    self._notify_sprint_project_users(
                        project_id=projet_id,
                        notification_type=TypeNotification.DEADLINE_NEAR,
                        titre=f"Deadline proche: {updated.nom}",
                        message=(
                            f"Le sprint {updated.nom} approche de sa date limite "
                            f"({updated.dateFin.strftime('%Y-%m-%d')})."
                        ),
                        priorite="haute",
                        exclude_user_id=current_user_id,
                    )
                elif remaining_seconds < 0:
                    self._notify_sprint_project_users(
                        project_id=projet_id,
                        notification_type=TypeNotification.SPRINT_DELAYED,
                        titre=f"Sprint en retard: {updated.nom}",
                        message=f"Le sprint {updated.nom} a depasse sa date limite.",
                        priorite="haute",
                        exclude_user_id=current_user_id,
                    )
        return updated

    def modifier_sprint_flexible(self, projet_id: int, sprint_id: int, data: UpdateSprintRequest, current_user_id: int):
        """Version flexible qui accepte n'importe quel projet_id"""
        sprint = self.repo.get_by_id(sprint_id)
        if not sprint:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Sprint {sprint_id} introuvable.")
        if sprint.statut == "termine":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Un sprint terminé ne peut plus être modifié.")
        updated = self.repo.update(sprint_id, data.model_dump(exclude_none=True))
        if updated:
            self._notify_sprint_project_users(
                project_id=sprint.projet_id,
                notification_type=TypeNotification.BACKLOG_UPDATED,
                titre=f"Sprint mis a jour: {updated.nom}",
                message=f"Le sprint {updated.nom} a ete modifie.",
                priorite="moyenne",
                exclude_user_id=current_user_id,
            )
            if updated.dateFin and updated.statut != "termine":
                remaining_seconds = (updated.dateFin - datetime.utcnow()).total_seconds()
                if 0 < remaining_seconds <= 3 * 24 * 3600:
                    self._notify_sprint_project_users(
                        project_id=sprint.projet_id,
                        notification_type=TypeNotification.DEADLINE_NEAR,
                        titre=f"Deadline proche: {updated.nom}",
                        message=(
                            f"Le sprint {updated.nom} approche de sa date limite "
                            f"({updated.dateFin.strftime('%Y-%m-%d')})."
                        ),
                        priorite="haute",
                        exclude_user_id=current_user_id,
                    )
                elif remaining_seconds < 0:
                    self._notify_sprint_project_users(
                        project_id=sprint.projet_id,
                        notification_type=TypeNotification.SPRINT_DELAYED,
                        titre=f"Sprint en retard: {updated.nom}",
                        message=f"Le sprint {updated.nom} a depasse sa date limite.",
                        priorite="haute",
                        exclude_user_id=current_user_id,
                    )
        return updated

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
            self._notify_sprint_project_users(
                project_id=projet_id,
                notification_type=TypeNotification.SPRINT_STARTED,
                titre=f"Sprint demarre: {updated.nom}",
                message=(
                    f"Le sprint {updated.nom} vient de demarrer pour le projet "
                    f"{updated.projet_id}."
                ),
                priorite="moyenne",
                exclude_user_id=current_user_id,
            )
        return self._apply_reference_to_sprint(updated, projet_id)

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
            self._notify_sprint_project_users(
                project_id=sprint.projet_id,
                notification_type=TypeNotification.SPRINT_STARTED,
                titre=f"Sprint demarre: {updated.nom}",
                message=(
                    f"Le sprint {updated.nom} vient de demarrer pour le projet "
                    f"{updated.projet_id}."
                ),
                priorite="moyenne",
                exclude_user_id=current_user_id,
            )
        return self._apply_reference_to_sprint(updated, sprint.projet_id)

    def cloturer_sprint(self, projet_id: int, sprint_id: int, current_user_id: int):
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        if sprint.statut != "en_cours":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail=f"Seul un sprint 'en_cours' peut être clôturé (statut actuel: {sprint.statut}).")
        updated = self.repo.cloturer(sprint_id)
        if updated:
            self._notify_sprint_project_users(
                project_id=projet_id,
                notification_type=TypeNotification.SPRINT_COMPLETED,
                titre=f"Sprint cloture: {updated.nom}",
                message=(
                    f"Le sprint {updated.nom} est termine. "
                    f"Velocite: {updated.velocite}."
                ),
                priorite="moyenne",
                exclude_user_id=current_user_id,
            )
        return self._apply_reference_to_sprint(updated, projet_id)

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
            self._notify_sprint_project_users(
                project_id=sprint.projet_id,
                notification_type=TypeNotification.SPRINT_COMPLETED,
                titre=f"Sprint cloture: {updated.nom}",
                message=(
                    f"Le sprint {updated.nom} est termine. "
                    f"Velocite: {updated.velocite}."
                ),
                priorite="moyenne",
                exclude_user_id=current_user_id,
            )
        return self._apply_reference_to_sprint(updated, sprint.projet_id)

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
            if added_stories:
                self.notification_service.notify_project_users(
                    project_id=projet_id,
                    titre="Nouvelle story planifiee",
                    message=f"Une user story a ete ajoutee au sprint {updated.nom}.",
                    notification_type=TypeNotification.USER_STORY_ADDED_TO_SPRINT,
                    priorite="moyenne",
                    exclude_user_id=current_user_id,
                )
        return self._apply_reference_to_sprint(updated, projet_id)

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
            if added_stories:
                self.notification_service.notify_project_users(
                    project_id=sprint.projet_id,
                    titre="Nouvelle story planifiee",
                    message=f"Une user story a ete ajoutee au sprint {updated.nom}.",
                    notification_type=TypeNotification.USER_STORY_ADDED_TO_SPRINT,
                    priorite="moyenne",
                    exclude_user_id=current_user_id,
                )
        return self._apply_reference_to_sprint(updated, sprint.projet_id)

    def retirer_userstories(self, projet_id: int, sprint_id: int, data: RetirerUserStoriesRequest, current_user_id: int):
        sprint = self._get_sprint_ou_404(sprint_id, projet_id)
        if sprint.statut == "termine":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Impossible de retirer des stories d'un sprint terminé.")
        removed_stories = [us for us in sprint.userstories if us.id in set(data.userstory_ids)]
        updated = self.repo.retirer_userstories(sprint_id, data.userstory_ids)
        if removed_stories and updated:
            self.notification_service.notify_project_users(
                project_id=projet_id,
                titre="Story retiree du sprint",
                message=f"Une user story a ete retiree du sprint {updated.nom}.",
                notification_type=TypeNotification.USER_STORY_REMOVED_FROM_SPRINT,
                priorite="basse",
                exclude_user_id=current_user_id,
            )
        return self._apply_reference_to_sprint(updated, projet_id)

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
        if removed_stories and updated:
            self.notification_service.notify_project_users(
                project_id=sprint.projet_id,
                titre="Story retiree du sprint",
                message=f"Une user story a ete retiree du sprint {updated.nom}.",
                notification_type=TypeNotification.USER_STORY_REMOVED_FROM_SPRINT,
                priorite="basse",
                exclude_user_id=current_user_id,
            )
        return self._apply_reference_to_sprint(updated, sprint.projet_id)

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
