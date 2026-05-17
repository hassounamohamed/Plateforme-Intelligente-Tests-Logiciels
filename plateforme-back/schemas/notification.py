from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict
from datetime import timezone


class NotificationResponse(BaseModel):
    # Ensure datetimes are serialized as UTC ISO strings with trailing Z
    model_config = ConfigDict(from_attributes=True, json_encoders={datetime: lambda v: v.replace(tzinfo=timezone.utc).isoformat().replace('+00:00','Z')})

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
