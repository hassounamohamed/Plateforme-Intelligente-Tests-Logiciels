"""
Schémas Pydantic pour la génération IA de tests unitaires par User Story.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# ─── Types littéraux ──────────────────────────────────────────────────────────

StatutValidation = Literal["approuvé", "rejeté"]
StatutExecution  = Literal["en_cours", "RÉUSSI", "ÉCHOUÉ", "NON_SUPPORTE"]


# ─── Structure JSON attendue de l'IA ─────────────────────────────────────────

class AIScenario(BaseModel):
    """Un scénario de test tel que retourné par le modèle IA."""
    nom:         str = ""
    description: str = ""
    type:        str = "happy_path"   # happy_path | error | edge_case | validation


class AITestUnitaire(BaseModel):
    """Un test unitaire tel que retourné par le modèle IA."""
    nom:         str = ""
    description: str = ""
    scenarios:   List[AIScenario] = []
    code:        str = ""


class AIUnitTestResponse(BaseModel):
    """Réponse complète de l'IA pour la génération de tests unitaires."""
    langage:     str = "python"
    framework:   str = "pytest"
    fichierTest: str = "test_generated.py"
    tests:       List[AITestUnitaire] = []


# ─── Requêtes ─────────────────────────────────────────────────────────────────

class UpdateTestUnitaireRequest(BaseModel):
    """Modifier le code ou les métadonnées d'un test unitaire."""
    nom:         Optional[str] = None
    description: Optional[str] = None
    code:        Optional[str] = None
    framework:   Optional[str] = None


class ValiderTestRequest(BaseModel):
    """Valider ou rejeter un test unitaire."""
    statut:      StatutValidation = Field(..., description="approuvé ou rejeté")
    decision:    Optional[str]    = Field(None, description="Décision courte")
    commentaires: Optional[str]   = Field(None, description="Commentaires libres")
    goNoGo:      bool             = Field(False, description="Go / No-Go final")


# ─── Réponses ─────────────────────────────────────────────────────────────────

class ScenarioTestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:          int
    nom:         Optional[str] = None
    description: Optional[str] = None
    type:        Optional[str] = None
    test_id:     Optional[int] = None


class ValidationTestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:            int
    dateValidation: datetime
    statut:        Optional[str] = None
    decision:      Optional[str] = None
    commentaires:  Optional[str] = None
    goNoGo:        bool = False
    testId:        Optional[int] = None
    validatorId:   Optional[int] = None


class ResultatTestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:            int
    statut:        Optional[str] = None
    messageErreur: Optional[str] = None
    logs:          Optional[str] = None
    commentaire:   Optional[str] = None


class ExecutionTestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:             int
    dateExecution:  datetime
    statut:         Optional[str] = None
    dureeExecution: Optional[int] = None
    test_id:        Optional[int] = None
    executeurId:    Optional[int] = None
    resultat:       Optional[ResultatTestResponse] = None


class TestUnitaireSummaryResponse(BaseModel):
    """Résumé d'un test unitaire pour la liste (inclut le code pour l'éditeur)."""
    model_config = ConfigDict(from_attributes=True)

    id:          int
    nom:         Optional[str] = None
    description: Optional[str] = None
    type:        str = "unitaire"
    langage:     Optional[str] = None
    framework:   Optional[str] = None
    code:        Optional[str] = None
    fichierTest: Optional[str] = None


class TestUnitaireResponse(TestUnitaireSummaryResponse):
    """Détail complet d'un test unitaire."""
    cahier_id:   Optional[int] = None
    userStoryId: Optional[int] = None
    scenarios:   List[ScenarioTestResponse]   = []
    validations: List[ValidationTestResponse] = []
    executions:  List[ExecutionTestResponse]  = []


class CahierDeTestsResponse(BaseModel):
    """Réponse du cahier de tests d'une User Story avec ses tests unitaires."""
    model_config = ConfigDict(from_attributes=True)

    id:                int
    dateGeneration:    datetime
    statut:            Optional[str] = None
    nombreTests:       int = 0
    userstory_id:      Optional[int] = None
    ai_generation_id:  Optional[int] = None
    tests:             List[TestUnitaireSummaryResponse] = []
