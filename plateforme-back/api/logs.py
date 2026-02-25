from datetime import datetime
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from starlette import status

from db.database import get_db
from models.user import Utilisateur
from core.rbac import get_current_user_with_role, ROLE_SUPER_ADMIN
from services.log_service import LogService


def require_super_admin(
    current_user: Utilisateur = Depends(get_current_user_with_role),
) -> Utilisateur:
    if not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acces reserve au Super Admin",
        )
    return current_user


router = APIRouter(
    prefix="/logs",
    tags=["logs"],
    dependencies=[Depends(require_super_admin)],
)

user_dependency = Annotated[Utilisateur, Depends(require_super_admin)]


def get_log_service(db: Session = Depends(get_db)) -> LogService:
    return LogService(db)
# ================= AUDIT LOGS =================

@router.get("/audit")
async def get_audit_logs(
    current_user: user_dependency,
    log_service: LogService = Depends(get_log_service),
    user_id: Optional[int] = Query(None, description="Filtrer par ID utilisateur"),
    action: Optional[str] = Query(None, description="Filtrer par action (ex: USER_LOGIN)"),
    entity_type: Optional[str] = Query(None, description="Filtrer par type d'entitÃ© (ex: user, role)"),
    start_date: Optional[datetime] = Query(None, description="Date de dÃ©but (ISO 8601)"),
    end_date: Optional[datetime] = Query(None, description="Date de fin (ISO 8601)"),
    ip_address: Optional[str] = Query(None, description="Filtrer par adresse IP"),
    skip: int = Query(0, ge=0, description="Offset pour la pagination"),
    limit: int = Query(50, ge=1, le=500, description="Nombre de rÃ©sultats par page"),
):
    """Logs d'audit avec filtres combinÃ©s. AccÃ¨s Super Admin uniquement."""
    return log_service.get_audit_logs(
        current_user=current_user,
        user_id=user_id, action=action, entity_type=entity_type,
        start_date=start_date, end_date=end_date, ip_address=ip_address,
        skip=skip, limit=limit,
    )


@router.get("/audit/actions")
async def get_available_actions(
    current_user: user_dependency,
    log_service: LogService = Depends(get_log_service),
):
    """Liste les actions distinctes prÃ©sentes dans les logs (pour alimenter les filtres)."""
    return log_service.get_available_actions(current_user)


@router.get("/audit/critical")
async def get_critical_audit_logs(
    current_user: user_dependency,
    log_service: LogService = Depends(get_log_service),
    hours: int = Query(24, ge=1, le=720, description="DerniÃ¨res N heures"),
):
    """Actions critiques uniquement (logins, suppressions, changements de rÃ´leâ€¦)."""
    return log_service.get_critical_audit_logs(current_user, hours=hours)


@router.get("/audit/export")
async def export_audit_logs(
    current_user: user_dependency,
    log_service: LogService = Depends(get_log_service),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
):
    """Export CSV des logs d'audit. AccÃ¨s Super Admin uniquement."""
    return log_service.export_audit_csv(
        current_user, start_date=start_date, end_date=end_date,
        user_id=user_id, action=action,
    )


# ================= SYSTEM LOGS =================

@router.get("/system")
async def get_system_logs(
    current_user: user_dependency,
    log_service: LogService = Depends(get_log_service),
    niveau: Optional[str] = Query(None, description="INFO | WARNING | ERROR | CRITICAL"),
    source: Optional[str] = Query(None, description="Filtrer par source"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    hours: Optional[int] = Query(None, ge=1, le=8760, description="DerniÃ¨res N heures"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
):
    """Logs systÃ¨me avec filtres. AccÃ¨s Super Admin uniquement."""
    return log_service.get_system_logs(
        current_user=current_user,
        niveau=niveau, source=source,
        start_date=start_date, end_date=end_date, hours=hours,
        skip=skip, limit=limit,
    )


@router.get("/system/export")
async def export_system_logs(
    current_user: user_dependency,
    log_service: LogService = Depends(get_log_service),
    niveau: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
):
    """Export CSV des logs systÃ¨me. AccÃ¨s Super Admin uniquement."""
    return log_service.export_system_csv(
        current_user, niveau=niveau, start_date=start_date, end_date=end_date,
    )


# ================= STATISTIQUES =================

@router.get("/stats")
async def get_logs_stats(
    current_user: user_dependency,
    log_service: LogService = Depends(get_log_service),
):
    """Tableau de bord statistiques des logs. AccÃ¨s Super Admin uniquement."""
    return log_service.get_stats(current_user)