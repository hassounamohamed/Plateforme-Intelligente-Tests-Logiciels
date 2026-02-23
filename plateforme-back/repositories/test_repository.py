"""
Repository pour la gestion des tests (CahierDeTests, Test, ScenarioTest, etc.)
"""
from typing import Optional, List
from sqlalchemy.orm import Session

from models.tests import (
    CahierDeTests, Test, TestUnitaire, TestAutomatise, 
    TestManuel, ScenarioTest, ValidationTest
)
from repositories.base_repository import BaseRepository


class CahierDeTestsRepository(BaseRepository[CahierDeTests]):
    """Repository pour les cahiers de tests"""
    
    def __init__(self, db: Session):
        super().__init__(CahierDeTests, db)
    
    def get_by_userstory(self, userstory_id: int) -> Optional[CahierDeTests]:
        """Récupérer le cahier de tests d'une user story"""
        return self.db.query(CahierDeTests).filter(
            CahierDeTests.userstory_id == userstory_id
        ).first()
    
    def get_by_status(self, statut: str) -> List[CahierDeTests]:
        """Récupérer les cahiers de tests par statut"""
        return self.db.query(CahierDeTests).filter(CahierDeTests.statut == statut).all()
    
    def update_test_count(self, cahier_id: int) -> Optional[CahierDeTests]:
        """Mettre à jour le nombre de tests dans un cahier"""
        cahier = self.get_by_id(cahier_id)
        if cahier:
            cahier.nombreTests = len(cahier.tests)
            self.db.commit()
            self.db.refresh(cahier)
        return cahier


class TestRepository(BaseRepository[Test]):
    """Repository pour les tests"""
    
    def __init__(self, db: Session):
        super().__init__(Test, db)
    
    def get_by_cahier(self, cahier_id: int) -> List[Test]:
        """Récupérer tous les tests d'un cahier"""
        return self.db.query(Test).filter(Test.cahier_id == cahier_id).all()
    
    def get_by_userstory(self, userstory_id: int) -> List[Test]:
        """Récupérer tous les tests d'une user story"""
        return self.db.query(Test).filter(Test.userStoryId == userstory_id).all()
    
    def get_by_type(self, test_type: str) -> List[Test]:
        """Récupérer tous les tests d'un type spécifique"""
        return self.db.query(Test).filter(Test.type == test_type).all()
    
    def get_unitaires(self) -> List[TestUnitaire]:
        """Récupérer tous les tests unitaires"""
        return self.db.query(TestUnitaire).all()
    
    def get_automatises(self) -> List[TestAutomatise]:
        """Récupérer tous les tests automatisés"""
        return self.db.query(TestAutomatise).all()
    
    def get_manuels(self) -> List[TestManuel]:
        """Récupérer tous les tests manuels"""
        return self.db.query(TestManuel).all()


class ScenarioTestRepository(BaseRepository[ScenarioTest]):
    """Repository pour les scénarios de test"""
    
    def __init__(self, db: Session):
        super().__init__(ScenarioTest, db)
    
    def get_by_test(self, test_id: int) -> List[ScenarioTest]:
        """Récupérer tous les scénarios d'un test"""
        return self.db.query(ScenarioTest).filter(ScenarioTest.test_id == test_id).all()
    
    def get_by_status(self, statut: str) -> List[ScenarioTest]:
        """Récupérer les scénarios par statut"""
        return self.db.query(ScenarioTest).filter(ScenarioTest.statut == statut).all()


class ValidationTestRepository(BaseRepository[ValidationTest]):
    """Repository pour les validations de test"""
    
    def __init__(self, db: Session):
        super().__init__(ValidationTest, db)
    
    def get_by_test(self, test_id: int) -> List[ValidationTest]:
        """Récupérer toutes les validations d'un test"""
        return self.db.query(ValidationTest).filter(ValidationTest.test_id == test_id).all()
    
    def get_by_validator(self, validator_id: int) -> List[ValidationTest]:
        """Récupérer toutes les validations effectuées par un validateur"""
        return self.db.query(ValidationTest).filter(ValidationTest.validatorId == validator_id).all()
    
    def get_approved(self) -> List[ValidationTest]:
        """Récupérer toutes les validations approuvées"""
        return self.db.query(ValidationTest).filter(ValidationTest.statut == "APPROUVE").all()
    
    def get_rejected(self) -> List[ValidationTest]:
        """Récupérer toutes les validations rejetées"""
        return self.db.query(ValidationTest).filter(ValidationTest.statut == "REJETE").all()
