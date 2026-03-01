from typing import Optional, List, Literal
from pydantic import BaseModel, Field

# MoSCoW priorités
PrioriteUS = Literal["must_have", "should_have", "could_have", "wont_have"]

# Statuts alignés avec les epics
StatutUS = Literal["to_do", "in_progress", "done"]

# Story points Fibonacci autorisés
STORY_POINTS_VALIDES = {1, 2, 3, 5, 8, 13, 21}


# ─── Requêtes ─────────────────────────────────────────────────────────────────

class CreateUserStoryRequest(BaseModel):
    """
    Format As a / I want / So that.
    Les trois champs `role`, `action`, `benefice` sont assemblés automatiquement
    en description : « En tant que {role}, je veux {action}, afin de {benefice}. »
    """
    titre: str = Field(..., min_length=1, description="Titre court de la user story")
    role: str = Field(
        ..., min_length=1,
        description="Qui ? ex: « développeur », « administrateur »"
    )
    action: str = Field(
        ..., min_length=1,
        description="Quoi ? ex: « me connecter avec mon email »"
    )
    benefice: Optional[str] = Field(
        None,
        description="Pourquoi ? ex: « accéder à mon espace personnel »"
    )
    criteresAcceptation: Optional[str] = Field(
        None,
        description="Critères d'acceptation (Gherkin ou texte libre)"
    )
    points: Optional[int] = Field(
        None,
        description="Story points Fibonacci : 1, 2, 3, 5, 8, 13, 21",
    )
    priorite: PrioriteUS = Field("should_have", description="Priorité MoSCoW")


class UpdateUserStoryRequest(BaseModel):
    titre: Optional[str] = Field(None, min_length=1)
    role: Optional[str] = Field(None, description="Mise à jour du 'En tant que'")
    action: Optional[str] = Field(None, description="Mise à jour du 'Je veux'")
    benefice: Optional[str] = Field(None, description="Mise à jour du 'Afin de'")
    criteresAcceptation: Optional[str] = None
    points: Optional[int] = Field(None)
    priorite: Optional[PrioriteUS] = None


class ChangerStatutUSRequest(BaseModel):
    statut: StatutUS = Field(..., description="to_do | in_progress | done")


class AssignerDeveloppeurRequest(BaseModel):
    developeur_id: int = Field(..., description="ID du développeur à assigner")


class ValiderUserStoryRequest(BaseModel):
    commentaire: Optional[str] = Field(None, description="Commentaire de validation")


# ─── Réponses ─────────────────────────────────────────────────────────────────

class UserStoryResponse(BaseModel):
    id: int
    titre: str
    description: Optional[str] = None   # "En tant que … je veux … afin de …"
    criteresAcceptation: Optional[str] = None
    points: Optional[int] = None
    priorite: str
    statut: str
    epic_id: int
    developerId: Optional[int] = None

    class Config:
        from_attributes = True
