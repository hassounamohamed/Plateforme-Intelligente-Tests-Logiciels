"""
Repositories - Couche d'accès aux données pour tous les modèles
"""
from repositories.base_repository import BaseRepository
from repositories.user_repository import UserRepository, RoleRepository, PermissionRepository
from repositories.scrum_repository import (
    ProjetRepository,
    ModuleRepository,
    EpicRepository,
    SprintRepository,
    UserStoryRepository
)
from repositories.test_repository import (
    CahierDeTestsRepository,
    TestRepository,
    ScenarioTestRepository,
    ValidationTestRepository
)
from repositories.anomalie_repository import AnomalieRepository
from repositories.execution_repository import ExecutionTestRepository, ResultatTestRepository
from repositories.notification_repository import NotificationRepository
from repositories.rapport_repository import (
    RapportQARepository,
    IndicateurQualiteRepository,
    RecommandationQualiteRepository
)
from repositories.log_repository import LogSystemsRepository, AuditLogRepository

__all__ = [
    # Base
    "BaseRepository",
    # User
    "UserRepository",
    "RoleRepository",
    "PermissionRepository",
    # Scrum
    "ProjetRepository",
    "ModuleRepository",
    "EpicRepository",
    "SprintRepository",
    "UserStoryRepository",
    # Test
    "CahierDeTestsRepository",
    "TestRepository",
    "ScenarioTestRepository",
    "ValidationTestRepository",
    # Anomalie
    "AnomalieRepository",
    # Execution
    "ExecutionTestRepository",
    "ResultatTestRepository",
    # Notification
    "NotificationRepository",
    # Rapport
    "RapportQARepository",
    "IndicateurQualiteRepository",
    "RecommandationQualiteRepository",
    # Log
    "LogSystemsRepository",
    "AuditLogRepository",
]
