from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class CreateUserRequest(BaseModel):
    nom: str = Field(..., min_length=1, description="Nom complet de l'utilisateur")
    email: EmailStr = Field(..., description="Adresse email de l'utilisateur")
    motDePasse: str = Field(..., min_length=8, description="Mot de passe (min 8 caractères)")
    telephone: str | None = Field(None, description="Numéro de téléphone (optionnel)")
    role_id: int = Field(default=2, ge=1, le=5, description="ID du rôle (1=SUPER_ADMIN, 2=DEVELOPPEUR, 3=TESTEUR_QA, 4=PRODUCT_OWNER, 5=SCRUM_MASTER)")


class UpdatePasswordRequest(BaseModel):
    ancien_mot_de_passe: str = Field(..., min_length=8, description="Ancien mot de passe")
    nouveau_mot_de_passe: str = Field(..., min_length=8, description="Nouveau mot de passe (min 8 caractères)")


class UpdateProfileRequest(BaseModel):
    nom: Optional[str] = Field(None, min_length=1, description="Nouveau nom")
    telephone: Optional[str] = Field(None, description="Nouveau numéro de téléphone")


class RoleSimple(BaseModel):
    id: int
    nom: str
    code: str

    class Config:
        from_attributes = True


class UserAdminResponse(BaseModel):
    id: int
    nom: str
    email: str
    telephone: Optional[str] = None
    actif: bool
    dateCreation: Optional[datetime] = None
    derniereConnexion: Optional[datetime] = None
    role: Optional[RoleSimple] = None

    class Config:
        from_attributes = True


class MembreDisponibleResponse(BaseModel):
    """Schéma pour la liste des membres disponibles pour assignation"""
    id: int
    nom: str
    email: str
    actif: bool
    role: Optional[RoleSimple] = None

    class Config:
        from_attributes = True
