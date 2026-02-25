import csv
import io
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from starlette import status

from models.log_systems import AuditLog, LogSystems
from models.user import Utilisateur
from repositories.log_repository import AuditLogRepository, LogSystemsRepository
from core.rbac.constants import ROLE_SUPER_ADMIN


# Actions surveillées comme "critiques"
CRITICAL_ACTIONS: List[str] = [
    "USER_CREATED", "USER_DELETED",
    "USER_ACTIVATED", "USER_DEACTIVATED",
    "USER_ROLE_ASSIGNED", "USER_ROLE_UPDATED", "USER_ROLE_CHANGED",
    "ROLE_CREATED", "ROLE_UPDATED", "ROLE_DELETED",
    "ROLE_PERMISSIONS_UPDATED", "ROLE_PERMISSION_REMOVED",
    "PERMISSION_CREATED",
    "USER_LOGIN",
]


class LogService:
    """Service de gestion des logs — injecter via Depends(get_log_service)."""

    def __init__(self, db: Session):
        self.db = db
        self.audit_repo = AuditLogRepository(db)
        self.system_repo = LogSystemsRepository(db)

    # =========================================================
    # GUARD
    # =========================================================

    def _require_super_admin(self, current_user: Utilisateur):
        """Lève une 403 si l'utilisateur n'est pas Super Admin."""
        if not current_user.role or current_user.role.code != ROLE_SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seul le Super Admin peut consulter les logs"
            )

    # =========================================================
    # 1. CONSULTATION LOGS D'AUDIT (avec filtres)
    # =========================================================

    def get_audit_logs(
        self,
        current_user: Utilisateur,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        ip_address: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """
        Retourne les logs d'audit avec filtres combinés + pagination.

        Filtres disponibles :
          - user_id      : actions d'un utilisateur spécifique
          - action       : type d'action (recherche partielle, insensible à la casse)
          - entity_type  : type d'entité (user, role, permission…)
          - start_date   : borne inférieure de date
          - end_date     : borne supérieure de date
          - ip_address   : adresse IP exacte

        Returns:
            { total, skip, limit, filters_applied, logs: [...] }
        """
        self._require_super_admin(current_user)

        query = self.db.query(AuditLog)

        if user_id is not None:
            query = query.filter(AuditLog.userId == user_id)
        if action:
            query = query.filter(AuditLog.action.ilike(f"%{action}%"))
        if entity_type:
            query = query.filter(AuditLog.entityType.ilike(f"%{entity_type}%"))
        if start_date:
            query = query.filter(AuditLog.timestamp >= start_date)
        if end_date:
            query = query.filter(AuditLog.timestamp <= end_date)
        if ip_address:
            query = query.filter(AuditLog.ipAddress == ip_address)

        total = query.count()
        logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "filters_applied": {
                "user_id": user_id,
                "action": action,
                "entity_type": entity_type,
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None,
                "ip_address": ip_address,
            },
            "logs": [self._format_audit(log) for log in logs],
        }

    def get_critical_audit_logs(
        self,
        current_user: Utilisateur,
        hours: int = 24,
    ) -> Dict[str, Any]:
        """
        Retourne uniquement les actions critiques sur les N dernières heures.

        Returns:
            { total, window_hours, critical_actions_monitored, logs: [...] }
        """
        self._require_super_admin(current_user)

        date_limit = datetime.utcnow() - timedelta(hours=hours)
        logs = (
            self.db.query(AuditLog)
            .filter(
                AuditLog.action.in_(CRITICAL_ACTIONS),
                AuditLog.timestamp >= date_limit,
            )
            .order_by(AuditLog.timestamp.desc())
            .all()
        )

        return {
            "total": len(logs),
            "window_hours": hours,
            "critical_actions_monitored": CRITICAL_ACTIONS,
            "logs": [self._format_audit(log) for log in logs],
        }

    def get_available_actions(self, current_user: Utilisateur) -> Dict[str, List[str]]:
        """
        Retourne la liste de toutes les actions distinctes présentes dans les logs.
        Utile pour alimenter les filtres de l'interface.
        """
        self._require_super_admin(current_user)

        rows = (
            self.db.query(AuditLog.action)
            .distinct()
            .filter(AuditLog.action.isnot(None))
            .all()
        )
        return {"actions": sorted(r[0] for r in rows if r[0])}

    # =========================================================
    # 2. CONSULTATION LOGS SYSTÈME (avec filtres)
    # =========================================================

    VALID_NIVEAUX = {"INFO", "WARNING", "ERROR", "CRITICAL"}

    def get_system_logs(
        self,
        current_user: Utilisateur,
        niveau: Optional[str] = None,
        source: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        hours: Optional[int] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """
        Retourne les logs système avec filtres + pagination.

        Filtres disponibles :
          - niveau     : INFO | WARNING | ERROR | CRITICAL
          - source     : recherche partielle sur la source
          - start_date : borne inférieure de date
          - end_date   : borne supérieure de date
          - hours      : raccourci « dernières N heures » (ignoré si start_date présent)

        Returns:
            { total, skip, limit, logs: [...] }
        """
        self._require_super_admin(current_user)

        if niveau and niveau.upper() not in self.VALID_NIVEAUX:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Niveau invalide. Valeurs acceptées : {', '.join(sorted(self.VALID_NIVEAUX))}"
            )

        query = self.db.query(LogSystems)

        if niveau:
            query = query.filter(LogSystems.niveau == niveau.upper())
        if source:
            query = query.filter(LogSystems.source.ilike(f"%{source}%"))
        if start_date:
            query = query.filter(LogSystems.date_time >= start_date)
        elif hours:
            query = query.filter(
                LogSystems.date_time >= datetime.utcnow() - timedelta(hours=hours)
            )
        if end_date:
            query = query.filter(LogSystems.date_time <= end_date)

        total = query.count()
        logs = query.order_by(LogSystems.date_time.desc()).offset(skip).limit(limit).all()

        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "logs": [self._format_system(log) for log in logs],
        }

    # =========================================================
    # 3. EXPORT CSV
    # =========================================================

    def export_audit_csv(
        self,
        current_user: Utilisateur,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
    ) -> StreamingResponse:
        """
        Génère et retourne un fichier CSV des logs d'audit.

        Colonnes : ID ; Date/Heure ; Utilisateur ID ; Nom ; Email ;
                   Action ; Type Entité ; ID Entité ; IP ; User-Agent ; Changements
        """
        self._require_super_admin(current_user)

        query = self.db.query(AuditLog)
        if start_date:
            query = query.filter(AuditLog.timestamp >= start_date)
        if end_date:
            query = query.filter(AuditLog.timestamp <= end_date)
        if user_id:
            query = query.filter(AuditLog.userId == user_id)
        if action:
            query = query.filter(AuditLog.action.ilike(f"%{action}%"))

        logs = query.order_by(AuditLog.timestamp.desc()).all()

        output = io.StringIO()
        writer = csv.writer(output, delimiter=";", quotechar='"', quoting=csv.QUOTE_MINIMAL)
        writer.writerow([
            "ID", "Date/Heure", "Utilisateur ID", "Nom Utilisateur", "Email",
            "Action", "Type Entité", "ID Entité",
            "Adresse IP", "User Agent", "Changements",
        ])
        for log in logs:
            writer.writerow([
                log.id,
                log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "",
                log.userId or "",
                log.user.nom if log.user else "",
                log.user.email if log.user else "",
                log.action or "",
                log.entityType or "",
                log.entityId or "",
                log.ipAddress or "",
                log.userAgent or "",
                log.changes or "",
            ])

        output.seek(0)
        filename = f"audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    def export_system_csv(
        self,
        current_user: Utilisateur,
        niveau: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> StreamingResponse:
        """
        Génère et retourne un fichier CSV des logs système.

        Colonnes : ID ; Date/Heure ; Niveau ; Source ; Message ; Détails
        """
        self._require_super_admin(current_user)

        query = self.db.query(LogSystems)
        if niveau:
            query = query.filter(LogSystems.niveau == niveau.upper())
        if start_date:
            query = query.filter(LogSystems.date_time >= start_date)
        if end_date:
            query = query.filter(LogSystems.date_time <= end_date)

        logs = query.order_by(LogSystems.date_time.desc()).all()

        output = io.StringIO()
        writer = csv.writer(output, delimiter=";", quotechar='"', quoting=csv.QUOTE_MINIMAL)
        writer.writerow(["ID", "Date/Heure", "Niveau", "Source", "Message", "Détails"])
        for log in logs:
            writer.writerow([
                log.id,
                log.date_time.strftime("%Y-%m-%d %H:%M:%S") if log.date_time else "",
                log.niveau or "",
                log.source or "",
                log.message or "",
                log.details or "",
            ])

        output.seek(0)
        filename = f"system_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    # =========================================================
    # 4. STATISTIQUES
    # =========================================================

    def get_stats(self, current_user: Utilisateur) -> Dict[str, Any]:
        """
        Tableau de bord statistiques des logs.

        Retourne :
          - Totaux globaux (audit + système, dernières 24 h)
          - Actions par type sur 30 jours
          - Logs système par niveau sur 7 jours
          - Top 5 des utilisateurs les plus actifs sur 30 jours
          - Activité par jour sur 7 jours
        """
        self._require_super_admin(current_user)

        now = datetime.utcnow()
        last_30d = now - timedelta(days=30)
        last_7d  = now - timedelta(days=7)
        last_24h = now - timedelta(hours=24)

        # Totaux globaux
        totals = {
            "audit_total":        self.db.query(AuditLog).count(),
            "audit_last_24h":     self.db.query(AuditLog).filter(AuditLog.timestamp >= last_24h).count(),
            "system_total":       self.db.query(LogSystems).count(),
            "system_errors_24h":  self.db.query(LogSystems).filter(
                LogSystems.date_time >= last_24h,
                LogSystems.niveau.in_(["ERROR", "CRITICAL"]),
            ).count(),
        }

        # Actions par type — 30 derniers jours
        actions_counts = (
            self.db.query(AuditLog.action, func.count(AuditLog.id).label("count"))
            .filter(AuditLog.timestamp >= last_30d)
            .group_by(AuditLog.action)
            .order_by(func.count(AuditLog.id).desc())
            .all()
        )

        # Logs système par niveau — 7 derniers jours
        system_by_niveau = (
            self.db.query(LogSystems.niveau, func.count(LogSystems.id).label("count"))
            .filter(LogSystems.date_time >= last_7d)
            .group_by(LogSystems.niveau)
            .all()
        )

        # Top 5 utilisateurs — 30 derniers jours
        top_rows = (
            self.db.query(AuditLog.userId, func.count(AuditLog.id).label("cnt"))
            .filter(AuditLog.timestamp >= last_30d, AuditLog.userId.isnot(None))
            .group_by(AuditLog.userId)
            .order_by(func.count(AuditLog.id).desc())
            .limit(5)
            .all()
        )
        top_users = []
        for uid, cnt in top_rows:
            user = self.db.query(Utilisateur).filter(Utilisateur.id == uid).first()
            top_users.append({
                "user_id":      uid,
                "nom":          user.nom   if user else "Inconnu",
                "email":        user.email if user else "Inconnu",
                "action_count": cnt,
            })

        # Activité par jour — 7 derniers jours
        daily = []
        for i in range(7):
            day_start = (now - timedelta(days=6 - i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end   = day_start + timedelta(days=1)
            cnt = self.db.query(AuditLog).filter(
                AuditLog.timestamp >= day_start,
                AuditLog.timestamp <  day_end,
            ).count()
            daily.append({"date": day_start.strftime("%Y-%m-%d"), "count": cnt})

        return {
            "generated_at":             now.isoformat(),
            "totals":                   totals,
            "actions_by_type":          [{"action": a, "count": c} for a, c in actions_counts],
            "system_logs_by_niveau":    [{"niveau": n, "count": c} for n, c in system_by_niveau],
            "top_active_users":         top_users,
            "daily_activity_last_7d":   daily,
        }

    # =========================================================
    # 5. ÉCRITURE D'UN LOG D'AUDIT (appelé par les autres services)
    # =========================================================

    def log_action(
        self,
        user_id: Optional[int],
        action: str,
        entity_type: str,
        entity_id: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        changes: Optional[str] = None,
    ) -> AuditLog:
        """
        Crée une entrée dans la table audit_log.

        Utilisé par tous les services qui souhaitent tracer une action
        (AuthService, RoleService, etc.). Échec silencieux pour ne pas
        interrompre l'opération principale.

        Returns:
            L'objet AuditLog créé.
        """
        return self.audit_repo.log_action(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            ip_address=ip_address,
            user_agent=user_agent,
            changes=changes,
        )

    def log_system_event(
        self,
        niveau: str,
        message: str,
        source: str,
        details: Optional[str] = None,
    ) -> LogSystems:
        """
        Crée une entrée dans la table log_systems.

        Args:
            niveau  : INFO | WARNING | ERROR | CRITICAL
            message : Message bref
            source  : Composant source (ex: "auth", "roles", "scheduler")
            details : Informations complémentaires (stack trace, JSON, etc.)
        """
        log = LogSystems(
            niveau=niveau.upper(),
            message=message,
            source=source,
            details=details,
            date_time=datetime.utcnow(),
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    # =========================================================
    # FORMATTERS PRIVÉS
    # =========================================================

    def _format_audit(self, log: AuditLog) -> Dict[str, Any]:
        """Sérialise un AuditLog en dict JSON-compatible."""
        return {
            "id":          log.id,
            "action":      log.action,
            "timestamp":   log.timestamp.isoformat() if log.timestamp else None,
            "entity_type": log.entityType,
            "entity_id":   log.entityId,
            "changes":     log.changes,
            "ip_address":  log.ipAddress,
            "user_agent":  log.userAgent,
            "user_id":     log.userId,
            "user": {
                "id":    log.user.id,
                "nom":   log.user.nom,
                "email": log.user.email,
            } if log.user else None,
        }

    def _format_system(self, log: LogSystems) -> Dict[str, Any]:
        """Sérialise un LogSystems en dict JSON-compatible."""
        return {
            "id":        log.id,
            "niveau":    log.niveau,
            "message":   log.message,
            "date_time": log.date_time.isoformat() if log.date_time else None,
            "source":    log.source,
            "details":   log.details,
        }
