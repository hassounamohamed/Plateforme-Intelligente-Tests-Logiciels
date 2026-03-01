from typing import Optional, List
from pydantic import BaseModel, Field


# ─── Requêtes ─────────────────────────────────────────────────────────────────

class ReordonnerBacklogRequest(BaseModel):
    ordre: List[int] = Field(
        ...,
        min_length=1,
        description="Liste des IDs des user stories dans le nouvel ordre (drag & drop)",
    )


# ─── Réponses ─────────────────────────────────────────────────────────────────

class EpicInfo(BaseModel):
    id: int
    titre: str

    class Config:
        from_attributes = True


class BacklogItemResponse(BaseModel):
    """Une user story dans la vue backlog, enrichie de l'info epic."""
    id: int
    titre: str
    description: Optional[str] = None
    criteresAcceptation: Optional[str] = None
    points: Optional[int] = None
    priorite: str
    statut: str
    ordre: int
    epic_id: int
    epic: Optional[EpicInfo] = None
    developerId: Optional[int] = None

    class Config:
        from_attributes = True


class BacklogStatutDetail(BaseModel):
    nb: int
    points: int


class BacklogEpicDetail(BaseModel):
    epic_id: int
    titre: str
    nb: int
    points: int
    points_done: int


class BacklogIndicateursResponse(BaseModel):
    """Indicateurs agrégés story points pour le projet."""
    projet_id: int
    total_stories: int
    total_points: int
    points_done: int
    par_statut: dict
    par_epic: List[BacklogEpicDetail]
