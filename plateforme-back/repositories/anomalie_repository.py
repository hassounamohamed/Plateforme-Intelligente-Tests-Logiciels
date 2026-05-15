"""
Repository pour la gestion des anomalies
"""
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from models.anomalie import Anomalie
from models.cahier_test_global import CasTest, CahierTestGlobal
from repositories.base_repository import BaseRepository


class AnomalieRepository(BaseRepository[Anomalie]):
    """Repository pour les anomalies"""
    
    def __init__(self, db: Session):
        super().__init__(Anomalie, db)
    
    def get_by_resultat(self, resultat_id: int) -> List[Anomalie]:
        """Récupérer toutes les anomalies d'un résultat de test"""
        return self.db.query(Anomalie).filter(Anomalie.resultat_id == resultat_id).all()

    def get_by_cas_test(self, cas_test_id: int) -> List[Anomalie]:
        return (
            self.db.query(Anomalie)
            .options(
                joinedload(Anomalie.cas_test),
                joinedload(Anomalie.reporter),
                joinedload(Anomalie.assigned),
            )
            .filter(Anomalie.cas_test_id == cas_test_id)
            .order_by(Anomalie.dateCreation.desc())
            .all()
        )

    def get_by_projet(
        self,
        projet_id: int,
        statut: Optional[str] = None,
    ) -> List[Anomalie]:
        query = (
            self.db.query(Anomalie)
            .join(CasTest, Anomalie.cas_test_id == CasTest.id)
            .join(CahierTestGlobal, CasTest.cahier_id == CahierTestGlobal.id)
            .options(
                joinedload(Anomalie.cas_test),
                joinedload(Anomalie.reporter),
                joinedload(Anomalie.assigned),
            )
            .filter(CahierTestGlobal.projet_id == projet_id)
        )
        if statut:
            query = query.filter(Anomalie.statut == statut)
        return query.order_by(Anomalie.dateCreation.desc()).all()

    def get_by_id_for_projet(self, anomalie_id: int, projet_id: int) -> Optional[Anomalie]:
        return (
            self.db.query(Anomalie)
            .join(CasTest, Anomalie.cas_test_id == CasTest.id)
            .join(CahierTestGlobal, CasTest.cahier_id == CahierTestGlobal.id)
            .options(
                joinedload(Anomalie.cas_test),
                joinedload(Anomalie.reporter),
                joinedload(Anomalie.assigned),
            )
            .filter(Anomalie.id == anomalie_id, CahierTestGlobal.projet_id == projet_id)
            .first()
        )
    
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
