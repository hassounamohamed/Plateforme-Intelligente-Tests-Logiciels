from typing import List
from pydantic import BaseModel
from schemas.permission import PermissionResponse


class RoleResponse(BaseModel):
    id: int
    nom: str
    code: str
    description: str | None = None
    niveau_acces: int
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True


class CreateRoleRequest(BaseModel):
    nom: str
    code: str
    description: str | None = None
    niveau_acces: int


class UpdateRoleRequest(BaseModel):
    nom: str | None = None
    description: str | None = None
    niveau_acces: int | None = None


class AssignPermissionsRequest(BaseModel):
    permission_ids: List[int]


class AssignRoleToUserRequest(BaseModel):
    user_id: int
    role_id: int
