from typing import Optional, List
from pydantic import BaseModel, Field


# ─── Requêtes ─────────────────────────────────────────────────────────────────

class CreateModuleRequest(BaseModel):
    nom: str = Field(..., min_length=1, description="Nom du module")
    description: Optional[str] = Field(None, description="Description du module")
    ordre: Optional[int] = Field(0, description="Position d'affichage (0 = premier)")


class UpdateModuleRequest(BaseModel):
    nom: Optional[str] = Field(None, min_length=1, description="Nouveau nom")
    description: Optional[str] = Field(None, description="Nouvelle description")
    ordre: Optional[int] = Field(None, description="Nouvelle position")


class ReordonnerModulesRequest(BaseModel):
    ordre: List[int] = Field(
        ...,
        description="Liste des IDs des modules dans le nouvel ordre souhaité",
        min_length=1,
    )


# ─── Réponses ─────────────────────────────────────────────────────────────────

class EpicSummary(BaseModel):
    """Résumé léger d'un Epic pour affichage hiérarchique."""
    id: int
    titre: str
    statut: Optional[str] = None
    priorite: Optional[int] = None

    class Config:
        from_attributes = True


class ModuleResponse(BaseModel):
    id: int
    nom: str
    description: Optional[str] = None
    ordre: int
    projet_id: int

    class Config:
        from_attributes = True


class ModuleHierarchieResponse(ModuleResponse):
    """Module avec la liste de ses epics (hiérarchie visible)."""
    epics: List[EpicSummary] = []

    class Config:
        from_attributes = True
