from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    filename: str
    filepath: str
    content_type: str
    uploaded_at: datetime
    uploaded_by_id: Optional[int] = None
    projet_id: Optional[int] = None
    epic_id: Optional[int] = None
    userstory_id: Optional[int] = None
