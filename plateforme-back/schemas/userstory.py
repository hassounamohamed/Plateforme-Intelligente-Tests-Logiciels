from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field, model_validator, ConfigDict

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
    duree_estimee: Optional[float] = Field(
        None,
        gt=0,
        description="Durée estimée en heures (ex: 2.5). Obligatoire si points absent.",
    )
    start_date: Optional[datetime] = Field(None, description="Date de début de la user story")
    due_date: Optional[datetime] = Field(None, description="Date d'échéance de la user story")
    priorite: PrioriteUS = Field("should_have", description="Priorité MoSCoW")

    @model_validator(mode='after')
    def verifier_estimation(self):
        if self.points is None and self.duree_estimee is None:
            raise ValueError(
                "Au moins un des champs 'points' ou 'duree_estimee' est obligatoire."
            )
        return self


class UpdateUserStoryRequest(BaseModel):
    titre: Optional[str] = Field(None, min_length=1)
    role: Optional[str] = Field(None, description="Mise à jour du 'En tant que'")
    action: Optional[str] = Field(None, description="Mise à jour du 'Je veux'")
    benefice: Optional[str] = Field(None, description="Mise à jour du 'Afin de'")
    criteresAcceptation: Optional[str] = None
    points: Optional[int] = Field(None)
    duree_estimee: Optional[float] = Field(None, gt=0, description="Durée estimée en heures")
    start_date: Optional[datetime] = Field(None, description="Date de début")
    due_date: Optional[datetime] = Field(None, description="Date d'échéance")
    priorite: Optional[PrioriteUS] = None


class ChangerStatutUSRequest(BaseModel):
    statut: StatutUS = Field(..., description="to_do | in_progress | done")


class AssignerDeveloppeurRequest(BaseModel):
    developeur_id: int = Field(..., description="ID du développeur à assigner")


class AssignerTesteurRequest(BaseModel):
    testeur_id: int = Field(..., description="ID du testeur QA à assigner")


class ValiderUserStoryRequest(BaseModel):
    commentaire: Optional[str] = Field(None, description="Commentaire de validation")


# ─── Réponses ─────────────────────────────────────────────────────────────────

class UserStoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    reference: Optional[str] = None
    titre: str
    description: Optional[str] = None   # "En tant que … je veux … afin de …"
    criteresAcceptation: Optional[str] = None
    points: Optional[int] = None
    duree_estimee: Optional[float] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    priorite: str
    statut: str
    epic_id: int
    developerId: Optional[int] = None
    testerId: Optional[int] = None
