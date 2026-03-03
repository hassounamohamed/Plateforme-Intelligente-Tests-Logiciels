from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ─── Requêtes ─────────────────────────────────────────────────────────────────

class CreateProjetRequest(BaseModel):
    nom: str = Field(..., min_length=1, description="Nom du projet")
    description: Optional[str] = Field(None, description="Description du projet")
    dateDebut: Optional[datetime] = Field(None, description="Date de début")
    dateFin: Optional[datetime] = Field(None, description="Date de fin prévue")
    objectif: Optional[str] = Field(None, description="Objectif principal du projet")


class UpdateProjetRequest(BaseModel):
    nom: Optional[str] = Field(None, min_length=1, description="Nouveau nom")
    description: Optional[str] = Field(None, description="Nouvelle description")
    dateDebut: Optional[datetime] = Field(None, description="Date de début")
    dateFin: Optional[datetime] = Field(None, description="Date de fin prévue")
    objectif: Optional[str] = Field(None, description="Objectif principal")
    statut: Optional[str] = Field(None, description="Statut (actif, archivé, ...)")


class AssignerMembresRequest(BaseModel):
    membre_ids: List[int] = Field(..., description="IDs des membres à assigner au projet")


# ─── Réponses ─────────────────────────────────────────────────────────────────

class MembreSimple(BaseModel):
    id: int
    nom: str
    email: str
    actif: bool = True

    class Config:
        from_attributes = True


class ProjetResponse(BaseModel):
    id: int
    nom: str
    description: Optional[str] = None
    dateDebut: Optional[datetime] = None
    dateFin: Optional[datetime] = None
    objectif: Optional[str] = None
    statut: str
    productOwnerId: int
    membres: List[MembreSimple] = []

    class Config:
        from_attributes = True


class ProjetStatistiquesResponse(BaseModel):
    projet_id: int
    nom: str
    nb_sprints: int
    nb_modules: int
    statut: str
