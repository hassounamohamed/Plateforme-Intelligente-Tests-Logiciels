"""
Schémas Pydantic pour le système de génération IA du backlog Scrum.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# ─── Types littéraux ──────────────────────────────────────────────────────────

StatusGeneration = Literal["pending", "processing", "completed", "failed", "approved", "rejected"]
TypeGeneration   = Literal["generate_scrum", "generate_tests"]
StatusItem       = Literal["draft", "approved", "rejected", "modified"]
PriorityLevel    = Literal["High", "Medium", "Low"]
ItemType         = Literal["module", "epic", "user_story"]


# ─── Requêtes ─────────────────────────────────────────────────────────────────

class StartGenerationRequest(BaseModel):
    """Corps de la requête pour démarrer une génération IA."""
    type: TypeGeneration = Field("generate_scrum", description="Type de génération")


class UpdateItemStatusRequest(BaseModel):
    """Changer le statut d'un item généré (approve / reject / modify)."""
    status: StatusItem = Field(..., description="Nouveau statut de l'item")


class UpdateItemRequest(BaseModel):
    """Modifier le contenu d'un item généré (modification manuelle)."""
    title:               Optional[str]       = Field(None, description="Nouveau titre")
    description:         Optional[str]       = Field(None, description="Nouvelle description")
    acceptance_criteria: Optional[str]       = Field(None, description="Critères d'acceptation (JSON)")
    priority:            Optional[PriorityLevel] = Field(None, description="Priorité")
    story_points:        Optional[int]       = Field(None, ge=1, le=13, description="Points (1-13)")
    sprint:              Optional[int]       = Field(None, ge=1, le=6,  description="Numéro de sprint")
    duration:            Optional[str]       = Field(None, description="Durée estimée (ex: 4h)")
    status:              Optional[StatusItem]= Field(None, description="Statut")


# ─── Sous-schémas de réponse ──────────────────────────────────────────────────

class AILogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:           int
    step:         str
    message:      Optional[str]
    progress:     int
    created_at:   datetime


class AIGeneratedItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:                  int
    generation_id:       int
    type:                str
    parent_id:           Optional[int]
    title:               str
    description:         Optional[str]
    acceptance_criteria: Optional[str]
    priority:            Optional[str]
    story_points:        Optional[int]
    sprint:              Optional[int]
    duration:            Optional[str]
    status:              str
    created_at:          datetime

    # Enfants : epics → user stories ou modules → epics
    children: List["AIGeneratedItemResponse"] = []


class AIGenerationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:           int
    projet_id:    int
    user_id:      Optional[int]
    type:         str
    status:       str
    progress:     int
    created_at:   datetime
    completed_at: Optional[datetime]


class AIGenerationDetailResponse(AIGenerationResponse):
    """Réponse complète avec logs et items générés."""
    logs:  List[AILogResponse]              = []
    items: List[AIGeneratedItemResponse]    = []


# ─── Structure JSON renvoyée par l'IA ─────────────────────────────────────────
# Ces classes servent uniquement à valider / parser la réponse brute de l'IA.

class AIUserStory(BaseModel):
    description:         str
    priority:            PriorityLevel = "Medium"
    story_points:        int = Field(3, ge=1, le=13)
    sprint:              int = Field(1, ge=1, le=6)
    duration:            str = "4h"
    acceptance_criteria: List[str] = []


class AIEpic(BaseModel):
    name:         str
    user_stories: List[AIUserStory] = []


class AIModule(BaseModel):
    name:  str
    epics: List[AIEpic] = []


class AIBacklogResponse(BaseModel):
    """Structure attendue dans la réponse JSON de l'IA."""
    modules: List[AIModule] = []


class ApplyGenerationResponse(BaseModel):
    """Résumé retourné après application d'une génération IA au backlog."""
    generation_id: int
    modules_created: int
    epics_created: int
    stories_created: int