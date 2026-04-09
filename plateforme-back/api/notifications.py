from typing import Annotated, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.rbac.dependencies import get_current_user_with_role
from db.database import get_db
from models.user import Utilisateur
from schemas.notification import (
    DemoNotificationsResponse,
    MarkAllReadResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(db)


@router.get("/me", response_model=List[NotificationResponse])
async def list_my_notifications(
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    unread_only: bool = False,
    limit: int = 20,
    svc: NotificationService = Depends(get_notification_service),
):
    return svc.list_my_notifications(current_user.id, unread_only=unread_only, limit=limit)


@router.get("/me/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: NotificationService = Depends(get_notification_service),
):
    return {"unread_count": svc.get_unread_count(current_user.id)}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: int,
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: NotificationService = Depends(get_notification_service),
):
    return svc.mark_as_read(current_user.id, notification_id)


@router.patch("/me/read-all", response_model=MarkAllReadResponse)
async def mark_all_notifications_as_read(
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: NotificationService = Depends(get_notification_service),
):
    updated_count = svc.mark_all_as_read(current_user.id)
    return {"updated_count": updated_count}


@router.post("/me/demo", response_model=DemoNotificationsResponse)
async def create_demo_notifications(
    current_user: Annotated[Utilisateur, Depends(get_current_user_with_role)],
    svc: NotificationService = Depends(get_notification_service),
):
    notifications = svc.create_demo_notifications(current_user.id)
    return {"created_count": len(notifications), "notifications": notifications}
