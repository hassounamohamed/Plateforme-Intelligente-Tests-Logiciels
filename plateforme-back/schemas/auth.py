from typing import Optional
from pydantic import BaseModel


class TokenRole(BaseModel):
    id: int
    nom: str
    code: str
    niveau_acces: int


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    nom: str
    email: str
    role: Optional[TokenRole] = None
