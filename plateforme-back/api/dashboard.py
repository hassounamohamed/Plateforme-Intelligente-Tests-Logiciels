from datetime import datetime, timedelta
from typing import Annotated, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from starlette import status

from core.rbac import ROLE_SUPER_ADMIN, get_current_user_with_role
from db.database import get_db
from models.execution import ExecutionTest
from models.log_systems import AuditLog
from models.user import Utilisateur


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
    prefix="/dashboard",
    tags=["dashboard"],
    dependencies=[Depends(require_super_admin)],
)

user_dependency = Annotated[Utilisateur, Depends(require_super_admin)]


@router.get("/activity")
async def get_dashboard_activity(
    current_user: user_dependency,
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=30, description="Periode: 1 (24h), 7, 30"),
):
    now = datetime.utcnow()

    if days == 1:
        end_hour = now.replace(minute=0, second=0, microsecond=0)
        bucket_starts = [end_hour - timedelta(hours=23 - i) for i in range(24)]
        range_start = bucket_starts[0]

        logins_by_bucket: Dict[datetime, int] = {bucket: 0 for bucket in bucket_starts}
        tests_by_bucket: Dict[datetime, int] = {bucket: 0 for bucket in bucket_starts}

        login_rows = (
            db.query(AuditLog.timestamp)
            .filter(AuditLog.action == "USER_LOGIN", AuditLog.timestamp >= range_start)
            .all()
        )
        for (timestamp,) in login_rows:
            if not timestamp:
                continue
            bucket = timestamp.replace(minute=0, second=0, microsecond=0)
            if bucket in logins_by_bucket:
                logins_by_bucket[bucket] += 1

        execution_rows = (
            db.query(ExecutionTest.dateExecution)
            .filter(ExecutionTest.dateExecution >= range_start)
            .all()
        )
        for (execution_time,) in execution_rows:
            if not execution_time:
                continue
            bucket = execution_time.replace(minute=0, second=0, microsecond=0)
            if bucket in tests_by_bucket:
                tests_by_bucket[bucket] += 1

        return [
            {
                "date": bucket.isoformat(),
                "logins": logins_by_bucket[bucket],
                "testExecutions": tests_by_bucket[bucket],
            }
            for bucket in bucket_starts
        ]

    end_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    bucket_starts = [end_day - timedelta(days=days - 1 - i) for i in range(days)]
    range_start = bucket_starts[0]

    logins_by_day: Dict[datetime, int] = {bucket: 0 for bucket in bucket_starts}
    tests_by_day: Dict[datetime, int] = {bucket: 0 for bucket in bucket_starts}

    login_rows = (
        db.query(AuditLog.timestamp)
        .filter(AuditLog.action == "USER_LOGIN", AuditLog.timestamp >= range_start)
        .all()
    )
    for (timestamp,) in login_rows:
        if not timestamp:
            continue
        bucket = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
        if bucket in logins_by_day:
            logins_by_day[bucket] += 1

    execution_rows = (
        db.query(ExecutionTest.dateExecution)
        .filter(ExecutionTest.dateExecution >= range_start)
        .all()
    )
    for (execution_time,) in execution_rows:
        if not execution_time:
            continue
        bucket = execution_time.replace(hour=0, minute=0, second=0, microsecond=0)
        if bucket in tests_by_day:
            tests_by_day[bucket] += 1

    return [
        {
            "date": bucket.date().isoformat(),
            "logins": logins_by_day[bucket],
            "testExecutions": tests_by_day[bucket],
        }
        for bucket in bucket_starts
    ]
