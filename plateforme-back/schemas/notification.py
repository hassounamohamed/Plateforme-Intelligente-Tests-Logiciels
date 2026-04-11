from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titre: str
    message: str
    type: str
    dateEnvoi: datetime
    lue: bool
    priorite: str
    destinataireId: int


class UnreadCountResponse(BaseModel):
    unread_count: int


class MarkAllReadResponse(BaseModel):
    updated_count: int


class DemoNotificationsResponse(BaseModel):
    created_count: int
    notifications: List[NotificationResponse]


class NotificationCatalogItemResponse(BaseModel):
    type: str
    title: str
    severity: str
    domain: str
    priorite: str


class NotificationCatalogResponse(BaseModel):
    items: List[NotificationCatalogItemResponse]
