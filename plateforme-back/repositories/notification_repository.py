"""
Repository pour la gestion des notifications
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from models.notification import Notification, TypeNotification
from repositories.base_repository import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    """Repository pour les notifications"""
    
    def __init__(self, db: Session):
        super().__init__(Notification, db)
    
    def get_by_destinataire(self, destinataire_id: int) -> List[Notification]:
        """Récupérer toutes les notifications d'un destinataire"""
        return self.db.query(Notification).filter(
            Notification.destinataireId == destinataire_id
        ).order_by(Notification.dateEnvoi.desc()).all()
    
    def get_unread(self, destinataire_id: int) -> List[Notification]:
        """Récupérer les notifications non lues d'un utilisateur"""
        return self.db.query(Notification).filter(
            Notification.destinataireId == destinataire_id,
            Notification.lue == False
        ).order_by(Notification.dateEnvoi.desc()).all()
    
    def get_read(self, destinataire_id: int) -> List[Notification]:
        """Récupérer les notifications lues d'un utilisateur"""
        return self.db.query(Notification).filter(
            Notification.destinataireId == destinataire_id,
            Notification.lue == True
        ).order_by(Notification.dateEnvoi.desc()).all()
    
    def get_by_type(self, notification_type: TypeNotification) -> List[Notification]:
        """Récupérer les notifications par type"""
        return self.db.query(Notification).filter(
            Notification.type == notification_type
        ).order_by(Notification.dateEnvoi.desc()).all()
    
    def get_by_priority(self, priorite: str) -> List[Notification]:
        """Récupérer les notifications par priorité"""
        return self.db.query(Notification).filter(
            Notification.priorite == priorite
        ).order_by(Notification.dateEnvoi.desc()).all()
    
    def get_recent(self, destinataire_id: int, days: int = 7) -> List[Notification]:
        """Récupérer les notifications récentes"""
        date_limit = datetime.utcnow() - timedelta(days=days)
        return self.db.query(Notification).filter(
            Notification.destinataireId == destinataire_id,
            Notification.dateEnvoi >= date_limit
        ).order_by(Notification.dateEnvoi.desc()).all()
    
    def mark_as_read(self, notification_id: int) -> Optional[Notification]:
        """Marquer une notification comme lue"""
        notification = self.get_by_id(notification_id)
        if notification:
            notification.lue = True
            self.db.commit()
            self.db.refresh(notification)
        return notification
    
    def mark_all_as_read(self, destinataire_id: int) -> int:
        """Marquer toutes les notifications d'un utilisateur comme lues"""
        count = self.db.query(Notification).filter(
            Notification.destinataireId == destinataire_id,
            Notification.lue == False
        ).update({"lue": True})
        self.db.commit()
        return count
    
    def count_unread(self, destinataire_id: int) -> int:
        """Compter les notifications non lues"""
        return self.db.query(Notification).filter(
            Notification.destinataireId == destinataire_id,
            Notification.lue == False
        ).count()
    
    def delete_old_notifications(self, days: int = 30) -> int:
        """Supprimer les anciennes notifications lues"""
        date_limit = datetime.utcnow() - timedelta(days=days)
        count = self.db.query(Notification).filter(
            Notification.lue == True,
            Notification.dateEnvoi < date_limit
        ).delete()
        self.db.commit()
        return count
