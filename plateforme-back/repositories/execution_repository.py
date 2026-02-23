"""
Repository pour la gestion des exécutions de tests et résultats
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from models.execution import ExecutionTest, ResultatTest
from repositories.base_repository import BaseRepository


class ExecutionTestRepository(BaseRepository[ExecutionTest]):
    """Repository pour les exécutions de test"""
    
    def __init__(self, db: Session):
        super().__init__(ExecutionTest, db)
    
    def get_by_test(self, test_id: int) -> List[ExecutionTest]:
        """Récupérer toutes les exécutions d'un test"""
        return self.db.query(ExecutionTest).filter(
            ExecutionTest.test_id == test_id
        ).order_by(ExecutionTest.dateExecution.desc()).all()
    
    def get_by_executeur(self, executeur_id: int) -> List[ExecutionTest]:
        """Récupérer toutes les exécutions effectuées par un exécuteur"""
        return self.db.query(ExecutionTest).filter(
            ExecutionTest.executeurId == executeur_id
        ).order_by(ExecutionTest.dateExecution.desc()).all()
    
    def get_by_status(self, statut: str) -> List[ExecutionTest]:
        """Récupérer les exécutions par statut"""
        return self.db.query(ExecutionTest).filter(ExecutionTest.statut == statut).all()
    
    def get_recent_executions(self, days: int = 7) -> List[ExecutionTest]:
        """Récupérer les exécutions récentes"""
        date_limit = datetime.utcnow() - timedelta(days=days)
        return self.db.query(ExecutionTest).filter(
            ExecutionTest.dateExecution >= date_limit
        ).order_by(ExecutionTest.dateExecution.desc()).all()
    
    def get_failed_executions(self) -> List[ExecutionTest]:
        """Récupérer toutes les exécutions échouées"""
        return self.db.query(ExecutionTest).filter(
            ExecutionTest.statut == "ECHEC"
        ).order_by(ExecutionTest.dateExecution.desc()).all()
    
    def get_successful_executions(self) -> List[ExecutionTest]:
        """Récupérer toutes les exécutions réussies"""
        return self.db.query(ExecutionTest).filter(
            ExecutionTest.statut == "SUCCES"
        ).all()
    
    def get_average_duration(self, test_id: int = None) -> float:
        """Calculer la durée moyenne d'exécution"""
        from sqlalchemy import func
        query = self.db.query(func.avg(ExecutionTest.dureeExecution))
        if test_id:
            query = query.filter(ExecutionTest.test_id == test_id)
        result = query.scalar()
        return float(result) if result else 0.0


class ResultatTestRepository(BaseRepository[ResultatTest]):
    """Repository pour les résultats de test"""
    
    def __init__(self, db: Session):
        super().__init__(ResultatTest, db)
    
    def get_by_execution(self, execution_id: int) -> Optional[ResultatTest]:
        """Récupérer le résultat d'une exécution"""
        return self.db.query(ResultatTest).filter(
            ResultatTest.execution_id == execution_id
        ).first()
    
    def get_by_status(self, statut: str) -> List[ResultatTest]:
        """Récupérer les résultats par statut"""
        return self.db.query(ResultatTest).filter(ResultatTest.statut == statut).all()
    
    def get_failed_results(self) -> List[ResultatTest]:
        """Récupérer tous les résultats d'échec"""
        return self.db.query(ResultatTest).filter(
            ResultatTest.statut == "ECHEC"
        ).all()
    
    def get_results_with_anomalies(self) -> List[ResultatTest]:
        """Récupérer les résultats ayant des anomalies"""
        return self.db.query(ResultatTest).filter(
            ResultatTest.anomalies.any()
        ).all()
