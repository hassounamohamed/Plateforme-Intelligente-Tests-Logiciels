from pydantic import BaseModel


class PermissionResponse(BaseModel):
    id: int
    nom: str
    resource: str
    action: str
    description: str | None = None

    class Config:
        from_attributes = True
