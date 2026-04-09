from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.notification import TypeNotification
from repositories.notification_repository import NotificationRepository


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

    def create_demo_notifications(self, user_id: int):
        payloads = [
            {
                "titre": "test failed ❌",
                "message": "Le cas de test TC-001 est en echec. Verifiez les logs.",
                "type": TypeNotification.TEST_FAILED,
                "priorite": "haute",
            },
            {
                "titre": "sprint started 🚀",
                "message": "Le sprint Sprint 5 a demarre.",
                "type": TypeNotification.SPRINT_STARTED,
                "priorite": "moyenne",
            },
            {
                "titre": "bug cree 🐞",
                "message": "Une anomalie a ete creee suite au test echoue.",
                "type": TypeNotification.ANOMALY_CREATED,
                "priorite": "haute",
            },
            {
                "titre": "rapport genere 📊",
                "message": "Le rapport QA du sprint est pret.",
                "type": TypeNotification.REPORT_GENERATED,
                "priorite": "basse",
            },
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
