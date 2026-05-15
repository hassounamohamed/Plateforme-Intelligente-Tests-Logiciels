"""
Repository pour la gestion des anomalies
"""
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from datetime import datetime

from models.anomalie import Anomalie
from models.cahier_test_global import CasTest, CahierTestGlobal
from models.execution import ExecutionTest, ResultatTest
from models.scrum import Epic, Module, Projet, UserStory
from models.tests import CahierDeTests, Test
from repositories.base_repository import BaseRepository


class AnomalieRepository(BaseRepository[Anomalie]):
    """Repository pour les anomalies"""
    
    def __init__(self, db: Session):
        super().__init__(Anomalie, db)

    def _query_by_projet(self, projet_id: int, statut: Optional[str] = None):
        query = (
            self.db.query(Anomalie)
            .join(ResultatTest, Anomalie.resultat_id == ResultatTest.id)
            .join(ExecutionTest, ResultatTest.execution_id == ExecutionTest.id)
            .join(Test, ExecutionTest.test_id == Test.id)
            .join(CahierDeTests, Test.cahier_id == CahierDeTests.id)
            .join(UserStory, CahierDeTests.userstory_id == UserStory.id)
            .join(Epic, UserStory.epic_id == Epic.id)
            .join(Module, Epic.module_id == Module.id)
            .join(Projet, Module.projet_id == Projet.id)
            .options(
                joinedload(Anomalie.resultat).joinedload(ResultatTest.execution),
                joinedload(Anomalie.reporter),
                joinedload(Anomalie.assigned),
            )
            .filter(Projet.id == projet_id)
        )
        if statut:
            query = query.filter(Anomalie.statut == statut)
        return query.order_by(Anomalie.dateCreation.desc())
    
    def get_by_resultat(self, resultat_id: int) -> List[Anomalie]:
        """Récupérer toutes les anomalies d'un résultat de test"""
        return self.db.query(Anomalie).filter(Anomalie.resultat_id == resultat_id).all()

    def get_by_cas_test(self, cas_test_id: int) -> List[Anomalie]:
        return (
            self.db.query(Anomalie)
            .options(
                joinedload(Anomalie.reporter),
                joinedload(Anomalie.assigned),
                joinedload(Anomalie.cas_test),
            )
            .filter(Anomalie.cas_test_id == cas_test_id)
            .order_by(Anomalie.dateCreation.desc())
            .all()
        )

    def create_for_cas_test(
        self,
        cas_test_id: int,
        reporter_id: int,
        titre: str,
        description: Optional[str],
        severite: str,
        priorite: str,
        assigned_to: Optional[int] = None,
    ) -> Anomalie:
        statut = "EN_COURS" if assigned_to else "NOUVEAU"
        anomalie = Anomalie(
            titre=titre,
            description=description,
            severite=severite,
            priorite=priorite,
            statut=statut,
            cas_test_id=cas_test_id,
            reporterId=reporter_id,
            assignedTo=assigned_to,
        )
        self.db.add(anomalie)
        self.db.commit()
        self.db.refresh(anomalie)
        return anomalie

    def get_by_projet(
        self,
        projet_id: int,
        statut: Optional[str] = None,
    ) -> List[Anomalie]:
        """
        Retourne toutes les anomalies du projet, qu'elles soient liées
        via l'ancien chemin (resultat_id) ou le nouveau (cas_test_id).
        """
        # --- IDs via ancien chemin (resultat_id) ---
        q_legacy = (
            self.db.query(Anomalie.id)
            .join(ResultatTest, Anomalie.resultat_id == ResultatTest.id)
            .join(ExecutionTest, ResultatTest.execution_id == ExecutionTest.id)
            .join(Test, ExecutionTest.test_id == Test.id)
            .join(CahierDeTests, Test.cahier_id == CahierDeTests.id)
            .join(UserStory, CahierDeTests.userstory_id == UserStory.id)
            .join(Epic, UserStory.epic_id == Epic.id)
            .join(Module, Epic.module_id == Module.id)
            .join(Projet, Module.projet_id == Projet.id)
            .filter(Projet.id == projet_id)
        )

        # --- IDs via nouveau chemin (cas_test_id) ---
        q_new = (
            self.db.query(Anomalie.id)
            .join(CasTest, Anomalie.cas_test_id == CasTest.id)
            .join(CahierTestGlobal, CasTest.cahier_id == CahierTestGlobal.id)
            .filter(CahierTestGlobal.projet_id == projet_id)
        )

        if statut:
            q_legacy = q_legacy.filter(Anomalie.statut == statut)
            q_new = q_new.filter(Anomalie.statut == statut)

        ids = {row[0] for row in q_legacy.all()} | {row[0] for row in q_new.all()}

        if not ids:
            return []

        return (
            self.db.query(Anomalie)
            .options(
                joinedload(Anomalie.reporter),
                joinedload(Anomalie.assigned),
                joinedload(Anomalie.cas_test),
            )
            .filter(Anomalie.id.in_(ids))
            .order_by(Anomalie.dateCreation.desc())
            .all()
        )

    def get_by_id_for_projet(self, anomalie_id: int, projet_id: int) -> Optional[Anomalie]:
        """Cherche l'anomalie via les deux chemins possibles."""

        # Nouveau chemin : cas_test_id → CahierTestGlobal.projet_id
        via_cas = (
            self.db.query(Anomalie)
            .join(CasTest, Anomalie.cas_test_id == CasTest.id)
            .join(CahierTestGlobal, CasTest.cahier_id == CahierTestGlobal.id)
            .options(
                joinedload(Anomalie.reporter),
                joinedload(Anomalie.assigned),
                joinedload(Anomalie.cas_test),
            )
            .filter(
                Anomalie.id == anomalie_id,
                CahierTestGlobal.projet_id == projet_id,
            )
            .first()
        )
        if via_cas:
            return via_cas

        # Ancien chemin : resultat_id → ... → projet
        return (
            self.db.query(Anomalie)
            .join(ResultatTest, Anomalie.resultat_id == ResultatTest.id)
            .join(ExecutionTest, ResultatTest.execution_id == ExecutionTest.id)
            .join(Test, ExecutionTest.test_id == Test.id)
            .join(CahierDeTests, Test.cahier_id == CahierDeTests.id)
            .join(UserStory, CahierDeTests.userstory_id == UserStory.id)
            .join(Epic, UserStory.epic_id == Epic.id)
            .join(Module, Epic.module_id == Module.id)
            .join(Projet, Module.projet_id == Projet.id)
            .options(
                joinedload(Anomalie.resultat).joinedload(ResultatTest.execution),
                joinedload(Anomalie.reporter),
                joinedload(Anomalie.assigned),
            )
            .filter(Anomalie.id == anomalie_id, Projet.id == projet_id)
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
