from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class OAuthProviderUser(BaseModel):
    id: int
    email: EmailStr
    nom: Optional[str] = None
    provider: Literal["google", "github"]
    role: Optional[str] = None


class OAuthLoginResponse(BaseModel):
    need_role: bool
    user_id: int
    access_token: Optional[str] = None
    token_type: Optional[str] = None
    user: OAuthProviderUser


class SelectRoleRequest(BaseModel):
    user_id: int = Field(..., gt=0)
    role: str = Field(..., min_length=2, max_length=50)


class SelectRoleResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: str
    pending_activation: Optional[bool] = None
    message: Optional[str] = None
    user: OAuthProviderUser
