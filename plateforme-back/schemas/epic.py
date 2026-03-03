from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field

# Statuts autorisés (To Do / In Progress / Done)
StatutEpic = Literal["to_do", "in_progress", "done"]


# ─── Requêtes ─────────────────────────────────────────────────────────────────

class CreateEpicRequest(BaseModel):
    titre: str = Field(..., min_length=1, description="Titre de l'epic")
    description: Optional[str] = Field(None, description="Description détaillée")
    priorite: int = Field(0, ge=0, description="Priorité (plus élevé = plus prioritaire)")
    businessValue: Optional[str] = Field(None, description="Valeur métier / ROI attendu")
    statut: StatutEpic = Field("to_do", description="Statut initial")


class UpdateEpicRequest(BaseModel):
    titre: Optional[str] = Field(None, min_length=1, description="Nouveau titre")
    description: Optional[str] = Field(None, description="Nouvelle description")
    priorite: Optional[int] = Field(None, ge=0, description="Nouvelle priorité")
    businessValue: Optional[str] = Field(None, description="Nouvelle valeur métier")


class ChangerStatutRequest(BaseModel):
    statut: StatutEpic = Field(..., description="Nouveau statut")


class ChangerPrioriteRequest(BaseModel):
    priorite: int = Field(..., ge=0, description="Nouvelle priorité")


# ─── Réponses ─────────────────────────────────────────────────────────────────

class UserStorySummary(BaseModel):
    """Résumé d'une user-story pour l'affichage hiérarchique."""
    id: int
    titre: str
    statut: Optional[str] = None
    points: Optional[int] = None
    priorite: Optional[str] = None

    class Config:
        from_attributes = True


class EpicResponse(BaseModel):
    id: int
    reference: Optional[str] = None
    titre: str
    description: Optional[str] = None
    priorite: int
    businessValue: Optional[str] = None
    statut: str
    dateCreation: datetime
    module_id: int
    productOwnerId: int

    class Config:
        from_attributes = True


class EpicHierarchieResponse(EpicResponse):
    """Epic avec ses user-stories (hiérarchie complète)."""
    userstories: List[UserStorySummary] = []

    class Config:
        from_attributes = True


class EpicProgressionResponse(BaseModel):
    epic_id: int
    titre: str
    statut: str
    total_userstories: int
    userstories_terminees: int
    pourcentage_completion: int

    class Config:
        from_attributes = True
