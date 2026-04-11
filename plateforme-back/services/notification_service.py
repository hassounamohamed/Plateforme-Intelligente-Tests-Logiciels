from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.notification import TypeNotification
from repositories.notification_repository import NotificationRepository


NOTIFICATION_CATALOG = [
    {
        "type": TypeNotification.TEST_PASSED,
        "title": "Test reussi",
        "severity": "success",
        "domain": "qa_tests",
        "priorite": "basse",
        "message": "Le test a ete execute avec succes.",
    },
    {
        "type": TypeNotification.SPRINT_COMPLETED,
        "title": "Sprint termine",
        "severity": "success",
        "domain": "scrum_sprint",
        "priorite": "moyenne",
        "message": "Le sprint a ete cloture avec succes.",
    },
    {
        "type": TypeNotification.TEST_FAILED,
        "title": "Test echoue",
        "severity": "error",
        "domain": "qa_tests",
        "priorite": "haute",
        "message": "Le test a echoue. Consultez les logs d'execution.",
    },
    {
        "type": TypeNotification.BUG_DETECTED,
        "title": "Bug detecte",
        "severity": "error",
        "domain": "qa_tests",
        "priorite": "haute",
        "message": "Une anomalie a ete detectee apres execution.",
    },
    {
        "type": TypeNotification.AI_FAILED,
        "title": "IA en echec",
        "severity": "error",
        "domain": "qa_tests",
        "priorite": "haute",
        "message": "La generation IA a echoue pour cette demande.",
    },
    {
        "type": TypeNotification.DEADLINE_NEAR,
        "title": "Deadline proche",
        "severity": "warning",
        "domain": "scrum_sprint",
        "priorite": "haute",
        "message": "La date limite approche. Pensez a finaliser les taches.",
    },
    {
        "type": TypeNotification.SPRINT_DELAYED,
        "title": "Sprint en retard",
        "severity": "warning",
        "domain": "scrum_sprint",
        "priorite": "haute",
        "message": "Le sprint presente du retard par rapport au planning.",
    },
    {
        "type": TypeNotification.PROJECT_CREATED,
        "title": "Nouveau projet cree",
        "severity": "info",
        "domain": "project_management",
        "priorite": "moyenne",
        "message": "Un nouveau projet a ete cree.",
    },
    {
        "type": TypeNotification.NEW_ASSIGNMENT,
        "title": "Nouvelle affectation",
        "severity": "info",
        "domain": "project_management",
        "priorite": "moyenne",
        "message": "Vous avez recu une nouvelle affectation.",
    },
    {
        "type": TypeNotification.PROJECT_UPDATED,
        "title": "Projet modifie",
        "severity": "info",
        "domain": "project_management",
        "priorite": "moyenne",
        "message": "Les informations du projet ont ete mises a jour.",
    },
    {
        "type": TypeNotification.PROJECT_ARCHIVED,
        "title": "Projet archive",
        "severity": "info",
        "domain": "project_management",
        "priorite": "basse",
        "message": "Le projet a ete archive.",
    },
    {
        "type": TypeNotification.PROJECT_MEMBER_ADDED,
        "title": "Nouveau membre ajoute au projet",
        "severity": "info",
        "domain": "project_management",
        "priorite": "moyenne",
        "message": "Un nouveau membre a rejoint le projet.",
    },
    {
        "type": TypeNotification.ADDED_TO_PROJECT,
        "title": "Tu as ete ajoute a un projet",
        "severity": "info",
        "domain": "project_management",
        "priorite": "moyenne",
        "message": "Vous avez ete ajoute en tant que membre du projet.",
    },
    {
        "type": TypeNotification.USER_STORY_CREATED,
        "title": "Nouvelle user story creee",
        "severity": "info",
        "domain": "backlog_user_stories",
        "priorite": "moyenne",
        "message": "Une nouvelle user story a ete ajoutee au backlog.",
    },
    {
        "type": TypeNotification.USER_STORY_UPDATED,
        "title": "User story modifiee",
        "severity": "info",
        "domain": "backlog_user_stories",
        "priorite": "moyenne",
        "message": "Une user story existante a ete modifiee.",
    },
    {
        "type": TypeNotification.USER_STORY_DELETED,
        "title": "User story supprimee",
        "severity": "warning",
        "domain": "backlog_user_stories",
        "priorite": "moyenne",
        "message": "Une user story a ete retiree du backlog.",
    },
    {
        "type": TypeNotification.USER_STORY_VALIDATED,
        "title": "User story validee",
        "severity": "success",
        "domain": "backlog_user_stories",
        "priorite": "moyenne",
        "message": "La user story a ete validee.",
    },
    {
        "type": TypeNotification.USER_STORY_ASSIGNED_TO_ME,
        "title": "User story assignee a toi",
        "severity": "info",
        "domain": "backlog_user_stories",
        "priorite": "moyenne",
        "message": "Une user story vous a ete assignee.",
    },
    {
        "type": TypeNotification.SPRINT_CREATED,
        "title": "Nouveau sprint cree",
        "severity": "info",
        "domain": "scrum_sprint",
        "priorite": "moyenne",
        "message": "Un nouveau sprint a ete planifie.",
    },
    {
        "type": TypeNotification.SPRINT_STARTED,
        "title": "Sprint demarre",
        "severity": "info",
        "domain": "scrum_sprint",
        "priorite": "moyenne",
        "message": "Le sprint vient de demarrer.",
    },
    {
        "type": TypeNotification.USER_STORY_ADDED_TO_SPRINT,
        "title": "User story ajoutee au sprint",
        "severity": "info",
        "domain": "scrum_sprint",
        "priorite": "moyenne",
        "message": "Une user story a ete ajoutee au sprint actif.",
    },
    {
        "type": TypeNotification.USER_STORY_REMOVED_FROM_SPRINT,
        "title": "User story retiree du sprint",
        "severity": "warning",
        "domain": "scrum_sprint",
        "priorite": "moyenne",
        "message": "Une user story a ete retiree du sprint.",
    },
    {
        "type": TypeNotification.BACKLOG_UPDATED,
        "title": "Backlog mis a jour",
        "severity": "info",
        "domain": "scrum_sprint",
        "priorite": "moyenne",
        "message": "Le backlog a ete mis a jour.",
    },
    {
        "type": TypeNotification.TEST_CREATED,
        "title": "Nouveau test cree",
        "severity": "info",
        "domain": "qa_tests",
        "priorite": "moyenne",
        "message": "Un nouveau cas de test est disponible.",
    },
    {
        "type": TypeNotification.TEST_ASSIGNED_TO_ME,
        "title": "Test assigne a toi",
        "severity": "info",
        "domain": "qa_tests",
        "priorite": "moyenne",
        "message": "Un test vous a ete assigne.",
    },
    {
        "type": TypeNotification.TEST_EXECUTED,
        "title": "Test execute",
        "severity": "info",
        "domain": "qa_tests",
        "priorite": "basse",
        "message": "Le test a ete execute avec un nouveau resultat.",
    },
    {
        "type": TypeNotification.TEST_RESULT_VALIDATED,
        "title": "Resultat valide",
        "severity": "success",
        "domain": "qa_tests",
        "priorite": "moyenne",
        "message": "Le resultat de test a ete valide.",
    },
    {
        "type": TypeNotification.REPORT_EXPORTED,
        "title": "Rapport exporte",
        "severity": "info",
        "domain": "qa_tests",
        "priorite": "basse",
        "message": "Le rapport QA a ete exporte.",
    },
]


class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationRepository(db)

    def list_my_notifications(self, user_id: int, unread_only: bool = False, limit: int = 20):
        notifications = self.repo.get_unread(user_id) if unread_only else self.repo.get_by_destinataire(user_id)
        return notifications[: max(1, min(limit, 100))]

    def get_unread_count(self, user_id: int) -> int:
        return self.repo.count_unread(user_id)

    def mark_as_read(self, user_id: int, notification_id: int):
        notification = self.repo.get_by_id(notification_id)
        if not notification:
            raise HTTPException(status_code=404, detail="Notification introuvable.")
        if notification.destinataireId != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez pas modifier cette notification.",
            )
        if not notification.lue:
            notification.lue = True
            self.db.commit()
            self.db.refresh(notification)
        return notification

    def mark_all_as_read(self, user_id: int) -> int:
        return self.repo.mark_all_as_read(user_id)

    def get_catalog(self):
        return [
            {
                "type": item["type"].value,
                "title": item["title"],
                "severity": item["severity"],
                "domain": item["domain"],
                "priorite": item["priorite"],
            }
            for item in NOTIFICATION_CATALOG
        ]

    def notify_user(
        self,
        user_id: int,
        titre: str,
        message: str,
        notification_type: TypeNotification,
        priorite: str = "moyenne",
        dedupe_window_seconds: int = 300,
    ):
        """Create a notification for one user, skipping near-duplicates in a short window."""
        recent = self.repo.get_by_destinataire(user_id)[:20]
        now = datetime.utcnow()
        for notif in recent:
            if notif.titre != titre:
                continue
            if (now - notif.dateEnvoi).total_seconds() < dedupe_window_seconds:
                return notif

        return self.repo.create(
            {
                "titre": titre,
                "message": message,
                "type": notification_type,
                "priorite": priorite,
                "destinataireId": user_id,
            }
        )

    def notify_users(
        self,
        user_ids: list[int],
        titre: str,
        message: str,
        notification_type: TypeNotification,
        priorite: str = "moyenne",
        exclude_user_id: int | None = None,
        dedupe_window_seconds: int = 300,
    ):
        """Create the same notification for a list of users."""
        created = []
        for uid in set(user_ids):
            if exclude_user_id is not None and uid == exclude_user_id:
                continue
            created.append(
                self.notify_user(
                    uid,
                    titre,
                    message,
                    notification_type,
                    priorite=priorite,
                    dedupe_window_seconds=dedupe_window_seconds,
                )
            )
        return created

    def create_demo_notifications(self, user_id: int):
        payloads = [
            {
                "titre": item["title"],
                "message": item["message"],
                "type": item["type"],
                "priorite": item["priorite"],
            }
            for item in NOTIFICATION_CATALOG
        ]

        created = []
        now = datetime.utcnow()
        for payload in payloads:
            existing = [
                n
                for n in self.repo.get_by_destinataire(user_id)[:20]
                if n.titre == payload["titre"] and (now - n.dateEnvoi).total_seconds() < 300
            ]
            if existing:
                continue

            notification = self.repo.create(
                {
                    "titre": payload["titre"],
                    "message": payload["message"],
                    "type": payload["type"],
                    "priorite": payload["priorite"],
                    "destinataireId": user_id,
                }
            )
            created.append(notification)

        return created
