# Import all models for easy access
from models.user import Utilisateur, Role, Permission
from models.scrum import Projet, Module, Epic, UserStory, Sprint
from models.ai_generation import AIGeneration, AILog, AIGeneratedItem, AIPromptLog
from models.attachment import Attachment
from models.tests import CahierDeTests, Test, TestUnitaire, TestAutomatise, TestManuel, ScenarioTest, ValidationTest
from models.execution import ExecutionTest, ResultatTest
from models.anomalie import Anomalie
from models.rapports import RapportQA, IndicateurQualite, RecommandationQualite
from models.notification import Notification, TypeNotification
from models.log_systems import LogSystems, AuditLog
from models.cahier_test_global import CahierTestGlobal, CasTest, CasTestHistory
from models.password_reset_token import PasswordResetToken

__all__ = [
    # AI Generation
    "AIGeneration",
    "AILog",
    "AIGeneratedItem",
    "AIPromptLog",
    # User models
    "Utilisateur",
    "Role",
    "Permission",
    # Scrum models
    "Projet",
    "Module",
    "Epic",
    "UserStory",
    "Sprint",
    # Attachment
    "Attachment",
    # Test models
    "CahierDeTests",
    "Test",
    "TestUnitaire",
    "TestAutomatise",
    "TestManuel",
    "ScenarioTest",
    "ValidationTest",
    # Execution models
    "ExecutionTest",
    "ResultatTest",
    # Anomalie models
    "Anomalie",
    # Rapport models
    "RapportQA",
    "IndicateurQualite",
    "RecommandationQualite",
    # Notification models
    "Notification",
    "TypeNotification",
    # Log models
    "LogSystems",
    "AuditLog",
    # Cahier de Tests Global
    "CahierTestGlobal",
    "CasTest",
    "CasTestHistory",
    # Password reset
    "PasswordResetToken",
]
