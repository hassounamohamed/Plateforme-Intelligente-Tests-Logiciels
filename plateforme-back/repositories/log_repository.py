"""
Repository pour la gestion des logs système et audits
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from models.log_systems import LogSystems, AuditLog
from repositories.base_repository import BaseRepository


class LogSystemsRepository(BaseRepository[LogSystems]):
    """Repository pour les logs système"""
    
    def __init__(self, db: Session):
        super().__init__(LogSystems, db)
    
    def get_by_niveau(self, niveau: str) -> List[LogSystems]:
        """Récupérer les logs par niveau (INFO, WARNING, ERROR, CRITICAL)"""
        return self.db.query(LogSystems).filter(
            LogSystems.niveau == niveau
        ).order_by(LogSystems.date_time.desc()).all()
    
    def get_by_source(self, source: str) -> List[LogSystems]:
        """Récupérer les logs par source"""
        return self.db.query(LogSystems).filter(
            LogSystems.source == source
        ).order_by(LogSystems.date_time.desc()).all()
    
    def get_recent_logs(self, hours: int = 24) -> List[LogSystems]:
        """Récupérer les logs récents"""
        date_limit = datetime.utcnow() - timedelta(hours=hours)
        return self.db.query(LogSystems).filter(
            LogSystems.date_time >= date_limit
        ).order_by(LogSystems.date_time.desc()).all()
    
    def get_errors(self) -> List[LogSystems]:
        """Récupérer tous les logs d'erreur"""
        return self.db.query(LogSystems).filter(
            LogSystems.niveau.in_(["ERROR", "CRITICAL"])
        ).order_by(LogSystems.date_time.desc()).all()
    
    def get_critical_logs(self) -> List[LogSystems]:
        """Récupérer les logs critiques"""
        return self.db.query(LogSystems).filter(
            LogSystems.niveau == "CRITICAL"
        ).order_by(LogSystems.date_time.desc()).all()
    
    def delete_old_logs(self, days: int = 90) -> int:
        """Supprimer les anciens logs"""
        date_limit = datetime.utcnow() - timedelta(days=days)
        count = self.db.query(LogSystems).filter(
            LogSystems.date_time < date_limit
        ).delete()
        self.db.commit()
        return count
    
    def count_by_niveau(self, niveau: str, hours: int = 24) -> int:
        """Compter les logs par niveau sur une période"""
        date_limit = datetime.utcnow() - timedelta(hours=hours)
        return self.db.query(LogSystems).filter(
            LogSystems.niveau == niveau,
            LogSystems.date_time >= date_limit
        ).count()


class AuditLogRepository(BaseRepository[AuditLog]):
    """Repository pour les logs d'audit"""
    
    def __init__(self, db: Session):
        super().__init__(AuditLog, db)
    
    def get_by_user(self, user_id: int) -> List[AuditLog]:
        """Récupérer tous les logs d'audit d'un utilisateur"""
        return self.db.query(AuditLog).filter(
            AuditLog.userId == user_id
        ).order_by(AuditLog.timestamp.desc()).all()
    
    def get_by_action(self, action: str) -> List[AuditLog]:
        """Récupérer les logs par action"""
        return self.db.query(AuditLog).filter(
            AuditLog.action == action
        ).order_by(AuditLog.timestamp.desc()).all()
    
    def get_by_entity(self, entity_type: str, entity_id: int = None) -> List[AuditLog]:
        """Récupérer les logs par type d'entité"""
        query = self.db.query(AuditLog).filter(AuditLog.entityType == entity_type)
        if entity_id:
            query = query.filter(AuditLog.entityId == entity_id)
        return query.order_by(AuditLog.timestamp.desc()).all()
    
    def get_recent_audits(self, days: int = 7) -> List[AuditLog]:
        """Récupérer les audits récents"""
        date_limit = datetime.utcnow() - timedelta(days=days)
        return self.db.query(AuditLog).filter(
            AuditLog.timestamp >= date_limit
        ).order_by(AuditLog.timestamp.desc()).all()
    
    def get_by_ip_address(self, ip_address: str) -> List[AuditLog]:
        """Récupérer les logs par adresse IP"""
        return self.db.query(AuditLog).filter(
            AuditLog.ipAddress == ip_address
        ).order_by(AuditLog.timestamp.desc()).all()
    
    def get_user_activity(self, user_id: int, days: int = 30) -> List[AuditLog]:
        """Récupérer l'activité d'un utilisateur sur une période"""
        date_limit = datetime.utcnow() - timedelta(days=days)
        return self.db.query(AuditLog).filter(
            AuditLog.userId == user_id,
            AuditLog.timestamp >= date_limit
        ).order_by(AuditLog.timestamp.desc()).all()
    
    def delete_old_audits(self, days: int = 365) -> int:
        """Supprimer les anciens logs d'audit"""
        date_limit = datetime.utcnow() - timedelta(days=days)
        count = self.db.query(AuditLog).filter(
            AuditLog.timestamp < date_limit
        ).delete()
        self.db.commit()
        return count
    
    def log_action(self, user_id: int, action: str, entity_type: str, 
                   entity_id: int, changes: str = None, 
                   ip_address: str = None, user_agent: str = None) -> AuditLog:
        """Créer un nouveau log d'audit"""
        audit = AuditLog(
            userId=user_id,
            action=action,
            entityType=entity_type,
            entityId=entity_id,
            changes=changes,
            ipAddress=ip_address,
            userAgent=user_agent
        )
        self.db.add(audit)
        self.db.commit()
        self.db.refresh(audit)
        return audit
