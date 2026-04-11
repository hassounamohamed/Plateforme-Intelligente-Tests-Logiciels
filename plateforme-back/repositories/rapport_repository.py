"""
Repository pour la gestion des rapports QA
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from models.rapports import RapportQA, IndicateurQualite, RecommandationQualite
from repositories.base_repository import BaseRepository


class RapportQARepository(BaseRepository[RapportQA]):
    """Repository pour les rapports QA"""
    
    def __init__(self, db: Session):
        super().__init__(RapportQA, db)
    
    def get_by_cahier(self, cahier_id: int) -> Optional[RapportQA]:
        """Récupérer le rapport QA d'un cahier global"""
        return self.db.query(RapportQA).filter(
            RapportQA.cahierId == cahier_id
        ).first()
    
    def get_by_status(self, statut: str) -> List[RapportQA]:
        """Récupérer les rapports par statut"""
        return self.db.query(RapportQA).filter(RapportQA.statut == statut).all()
    
    def get_recent_reports(self, days: int = 30) -> List[RapportQA]:
        """Récupérer les rapports récents"""
        date_limit = datetime.utcnow() - timedelta(days=days)
        return self.db.query(RapportQA).filter(
            RapportQA.dateGeneration >= date_limit
        ).order_by(RapportQA.dateGeneration.desc()).all()
    
    def get_reports_by_success_rate(self, min_rate: float) -> List[RapportQA]:
        """Récupérer les rapports avec un taux de réussite minimum"""
        return self.db.query(RapportQA).filter(
            RapportQA.tauxReussite >= min_rate
        ).order_by(RapportQA.tauxReussite.desc()).all()
    
    def get_average_success_rate(self) -> float:
        """Calculer le taux de réussite moyen"""
        from sqlalchemy import func
        result = self.db.query(func.avg(RapportQA.tauxReussite)).scalar()
        return float(result) if result else 0.0
    
    def update_statistics(self, rapport_id: int) -> Optional[RapportQA]:
        """Mettre à jour les statistiques d'un rapport"""
        rapport = self.get_by_id(rapport_id)
        if rapport and rapport.nombreTestsExecutes > 0:
            rapport.tauxReussite = (rapport.nombreTestsReussis / rapport.nombreTestsExecutes) * 100
            self.db.commit()
            self.db.refresh(rapport)
        return rapport


class IndicateurQualiteRepository(BaseRepository[IndicateurQualite]):
    """Repository pour les indicateurs de qualité"""
    
    def __init__(self, db: Session):
        super().__init__(IndicateurQualite, db)
    
    def get_by_rapport(self, rapport_id: int) -> Optional[IndicateurQualite]:
        """Récupérer les indicateurs d'un rapport"""
        return self.db.query(IndicateurQualite).filter(
            IndicateurQualite.rapportId == rapport_id
        ).first()
    
    def get_by_tendance(self, tendance: str) -> List[IndicateurQualite]:
        """Récupérer les indicateurs par tendance"""
        return self.db.query(IndicateurQualite).filter(
            IndicateurQualite.tendance == tendance
        ).all()
    
    def get_above_quality_threshold(self, threshold: float) -> List[IndicateurQualite]:
        """Récupérer les indicateurs au-dessus d'un seuil de qualité"""
        return self.db.query(IndicateurQualite).filter(
            IndicateurQualite.indiceQualite >= threshold
        ).all()


class RecommandationQualiteRepository(BaseRepository[RecommandationQualite]):
    """Repository pour les recommandations de qualité"""
    
    def __init__(self, db: Session):
        super().__init__(RecommandationQualite, db)
    
    def get_by_rapport(self, rapport_id: int) -> List[RecommandationQualite]:
        """Récupérer toutes les recommandations d'un rapport"""
        return self.db.query(RecommandationQualite).filter(
            RecommandationQualite.rapportId == rapport_id
        ).all()
    
    def get_by_categorie(self, categorie: str) -> List[RecommandationQualite]:
        """Récupérer les recommandations par catégorie"""
        return self.db.query(RecommandationQualite).filter(
            RecommandationQualite.categorie == categorie
        ).all()
    
    def get_by_priority(self, priorite: str) -> List[RecommandationQualite]:
        """Récupérer les recommandations par priorité"""
        return self.db.query(RecommandationQualite).filter(
            RecommandationQualite.priorite == priorite
        ).all()
