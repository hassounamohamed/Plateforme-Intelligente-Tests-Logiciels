from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AttachmentResponse(BaseModel):
    id: int
    filename: str
    filepath: str
    content_type: str
    uploaded_at: datetime
    uploaded_by_id: Optional[int] = None
    projet_id: Optional[int] = None
    epic_id: Optional[int] = None
    userstory_id: Optional[int] = None

    class Config:
        from_attributes = True
