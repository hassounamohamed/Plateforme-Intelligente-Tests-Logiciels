from datetime import datetime, timedelta
from typing import Annotated, Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.rbac.constants import ROLE_PRODUCT_OWNER
from core.rbac.decorators import require_role
from core.rbac.dependencies import get_current_user_with_role
from db.database import get_db
from models.user import Utilisateur
from models.scrum import Projet, Epic, UserStory, Module

router = APIRouter(
    prefix="/dashboard/product-owner",
    tags=["dashboard"],
)


@router.get("/progress")
@require_role(ROLE_PRODUCT_OWNER)
async def get_project_progress(
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=30, description="Periode: 1 (24h), 7, 30"),
):
    now = datetime.utcnow()

    project_ids = (
        db.query(Projet.id)
        .filter(Projet.productOwnerId == current_user.id)
        .all()
    )
    project_ids = [row[0] for row in project_ids]

    if not project_ids:
        return _build_empty_series(now, days, 0)

    total_count = (
        db.query(UserStory.id)
        .join(Epic, UserStory.epic_id == Epic.id)
        .join(Module, Epic.module_id == Module.id)
        .join(Projet, Module.projet_id == Projet.id)
        .filter(Projet.id.in_(project_ids))
        .count()
    )

    done_statuses = {"done", "termine", "terminee", "completed", "reussi"}
    done_total = (
        db.query(UserStory.id)
        .join(Epic, UserStory.epic_id == Epic.id)
        .join(Module, Epic.module_id == Module.id)
        .join(Projet, Module.projet_id == Projet.id)
        .filter(Projet.id.in_(project_ids))
        .filter(UserStory.statut.isnot(None))
        .filter(func.lower(UserStory.statut).in_(done_statuses))
        .count()
    )

    progress = 0.0
    if total_count > 0:
        progress = round((done_total / total_count) * 100, 2)

    return _build_empty_series(now, days, progress)


def _build_empty_series(now: datetime, days: int, progress: float) -> List[Dict[str, float | str]]:
    if days == 1:
        end_hour = now.replace(minute=0, second=0, microsecond=0)
        bucket_starts = [end_hour - timedelta(hours=23 - i) for i in range(24)]
        return [
            {
                "date": bucket.isoformat(),
                "progress": progress,
            }
            for bucket in bucket_starts
        ]

    end_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    bucket_starts = [end_day - timedelta(days=days - 1 - i) for i in range(days)]
    return [
        {
            "date": bucket.date().isoformat(),
            "progress": progress,
        }
        for bucket in bucket_starts
    ]