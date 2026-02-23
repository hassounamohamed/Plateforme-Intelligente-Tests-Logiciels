"""
Module RBAC (Role-Based Access Control) pour la gestion des rôles et permissions
"""
from core.rbac.constants import (
    ROLE_SUPER_ADMIN,
    ROLE_PRODUCT_OWNER,
    ROLE_SCRUM_MASTER,
    ROLE_DEVELOPPEUR,
    ROLE_TESTEUR_QA,
    NIVEAU_SUPER_ADMIN,
    NIVEAU_PRODUCT_OWNER,
    NIVEAU_SCRUM_MASTER,
    NIVEAU_TESTEUR_QA,
    NIVEAU_DEVELOPPEUR,
)
from core.rbac.dependencies import get_current_user_with_role
from core.rbac.decorators import (
    require_role,
    require_permission,
    require_min_level,
    check_user_has_permission,
    check_user_has_role,
)

__all__ = [
    # Constants
    "ROLE_SUPER_ADMIN",
    "ROLE_PRODUCT_OWNER",
    "ROLE_SCRUM_MASTER",
    "ROLE_DEVELOPPEUR",
    "ROLE_TESTEUR_QA",
    "NIVEAU_SUPER_ADMIN",
    "NIVEAU_PRODUCT_OWNER",
    "NIVEAU_SCRUM_MASTER",
    "NIVEAU_TESTEUR_QA",
    "NIVEAU_DEVELOPPEUR",
    # Dependencies
    "get_current_user_with_role",
    # Decorators & Helpers
    "require_role",
    "require_permission",
    "require_min_level",
    "check_user_has_permission",
    "check_user_has_role",
]
