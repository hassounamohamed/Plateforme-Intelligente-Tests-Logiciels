from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, model_validator


# ─── Requêtes ─────────────────────────────────────────────────────────────────

class CreateSprintRequest(BaseModel):
    nom: str = Field(..., min_length=1, description="Nom du sprint (ex: Sprint 1)")
    objectifSprint: Optional[str] = Field(None, description="Objectif du sprint")
    dateDebut: Optional[datetime] = Field(None, description="Date de début planifiée")
    dateFin: Optional[datetime] = Field(None, description="Date de fin planifiée")
    capaciteEquipe: Optional[int] = Field(None, ge=1, description="Capacité de l'équipe en points")

    @model_validator(mode="after")
    def dates_coherentes(self):
        if self.dateDebut and self.dateFin and self.dateFin <= self.dateDebut:
            raise ValueError("dateFin doit être postérieure à dateDebut.")
        return self


class UpdateSprintRequest(BaseModel):
    nom: Optional[str] = Field(None, min_length=1)
    objectifSprint: Optional[str] = None
    dateDebut: Optional[datetime] = None
    dateFin: Optional[datetime] = None
    capaciteEquipe: Optional[int] = Field(None, ge=1)

    @model_validator(mode="after")
    def dates_coherentes(self):
        if self.dateDebut and self.dateFin and self.dateFin <= self.dateDebut:
            raise ValueError("dateFin doit être postérieure à dateDebut.")
        return self


class AjouterUserStoriesRequest(BaseModel):
    userstory_ids: List[int] = Field(..., min_length=1, description="IDs des user stories à ajouter")


class RetirerUserStoriesRequest(BaseModel):
    userstory_ids: List[int] = Field(..., min_length=1, description="IDs des user stories à retirer")


# ─── Réponses ─────────────────────────────────────────────────────────────────

class UserStorySprint(BaseModel):
    """Résumé d'une user story dans le sprint."""
    id: int
    titre: str
    statut: str
    points: Optional[int] = None
    priorite: Optional[str] = None
    developerId: Optional[int] = None

    class Config:
        from_attributes = True


class SprintResponse(BaseModel):
    id: int
    nom: str
    objectifSprint: Optional[str] = None
    dateDebut: Optional[datetime] = None
    dateFin: Optional[datetime] = None
    capaciteEquipe: Optional[int] = None
    velocite: int
    statut: str
    projet_id: int
    scrumMasterId: int
    userstories: List[UserStorySprint] = []

    class Config:
        from_attributes = True


class SprintVelociteResponse(BaseModel):
    sprint_id: int
    nom: str
    statut: str
    velocite: int
    points_total: int
    points_termines: int
    nb_userstories: int
    nb_terminees: int
