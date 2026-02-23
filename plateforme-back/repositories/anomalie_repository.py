"""
Repository pour la gestion des anomalies
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime

from models.anomalie import Anomalie
from repositories.base_repository import BaseRepository


class AnomalieRepository(BaseRepository[Anomalie]):
    """Repository pour les anomalies"""
    
    def __init__(self, db: Session):
        super().__init__(Anomalie, db)
    
    def get_by_resultat(self, resultat_id: int) -> List[Anomalie]:
        """Récupérer toutes les anomalies d'un résultat de test"""
        return self.db.query(Anomalie).filter(Anomalie.resultat_id == resultat_id).all()
    
    def get_by_reporter(self, reporter_id: int) -> List[Anomalie]:
        """Récupérer toutes les anomalies rapportées par un utilisateur"""
        return self.db.query(Anomalie).filter(Anomalie.reporterId == reporter_id).all()
    
    def get_by_assigned(self, assigned_to: int) -> List[Anomalie]:
        """Récupérer toutes les anomalies assignées à un utilisateur"""
        return self.db.query(Anomalie).filter(Anomalie.assignedTo == assigned_to).all()
    
    def get_by_status(self, statut: str) -> List[Anomalie]:
        """Récupérer les anomalies par statut"""
        return self.db.query(Anomalie).filter(Anomalie.statut == statut).all()
    
    def get_by_severity(self, severite: str) -> List[Anomalie]:
        """Récupérer les anomalies par sévérité"""
        return self.db.query(Anomalie).filter(Anomalie.severite == severite).all()
    
    def get_by_priority(self, priorite: str) -> List[Anomalie]:
        """Récupérer les anomalies par priorité"""
        return self.db.query(Anomalie).filter(Anomalie.priorite == priorite).all()
    
    def get_open_anomalies(self) -> List[Anomalie]:
        """Récupérer toutes les anomalies ouvertes (non résolues)"""
        return self.db.query(Anomalie).filter(
            Anomalie.statut.in_(["NOUVEAU", "EN_COURS", "REOUVERT"])
        ).all()
    
    def get_critical_anomalies(self) -> List[Anomalie]:
        """Récupérer les anomalies critiques"""
        return self.db.query(Anomalie).filter(
            Anomalie.severite == "CRITIQUE",
            Anomalie.statut != "RESOLU"
        ).all()
    
    def resolve_anomalie(self, anomalie_id: int) -> Optional[Anomalie]:
        """Marquer une anomalie comme résolue"""
        anomalie = self.get_by_id(anomalie_id)
        if anomalie:
            anomalie.statut = "RESOLU"
            anomalie.dateResolution = datetime.utcnow()
            self.db.commit()
            self.db.refresh(anomalie)
        return anomalie
    
    def assign_anomalie(self, anomalie_id: int, user_id: int) -> Optional[Anomalie]:
        """Assigner une anomalie à un utilisateur"""
        anomalie = self.get_by_id(anomalie_id)
        if anomalie:
            anomalie.assignedTo = user_id
            anomalie.statut = "EN_COURS"
            self.db.commit()
            self.db.refresh(anomalie)
        return anomalie
    
    def reopen_anomalie(self, anomalie_id: int) -> Optional[Anomalie]:
        """Réouvrir une anomalie"""
        anomalie = self.get_by_id(anomalie_id)
        if anomalie:
            anomalie.statut = "REOUVERT"
            anomalie.dateResolution = None
            self.db.commit()
            self.db.refresh(anomalie)
        return anomalie
