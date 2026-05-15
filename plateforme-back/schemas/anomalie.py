from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

AnomalieStatut = Literal["NOUVEAU", "EN_COURS", "REOUVERT", "RESOLU"]
AnomalieSeverite = Literal["CRITIQUE", "MAJEURE", "MINEURE"]
AnomaliePriorite = Literal["HAUTE", "MOYENNE", "BASSE"]


class CreateAnomalieRequest(BaseModel):
    titre: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    severite: AnomalieSeverite = "MAJEURE"
    priorite: AnomaliePriorite = "MOYENNE"
    assigned_to: Optional[int] = Field(
        None,
        description="ID du developpeur assigne (passe l'anomalie en EN_COURS)",
    )


class UpdateAnomalieRequest(BaseModel):
    titre: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    severite: Optional[AnomalieSeverite] = None
    priorite: Optional[AnomaliePriorite] = None
    statut: Optional[AnomalieStatut] = None


class AssignAnomalieRequest(BaseModel):
    assigned_to: int = Field(..., description="ID de l'utilisateur assigne")


class AnomalieResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titre: str
    description: Optional[str] = None
    severite: str
    statut: str
    priorite: str
    dateCreation: datetime
    dateResolution: Optional[datetime] = None
    cas_test_id: Optional[int] = None
    resultat_id: Optional[int] = None
    reporterId: Optional[int] = None
    assignedTo: Optional[int] = None
    cas_test_ref: Optional[str] = None
    cas_test_titre: Optional[str] = None
    reporter_nom: Optional[str] = None
    assigned_nom: Optional[str] = None
