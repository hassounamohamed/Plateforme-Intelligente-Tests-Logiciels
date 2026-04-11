"""
Schémas Pydantic pour le Cahier de Tests Global.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# ─── Types littéraux ──────────────────────────────────────────────────────────

StatutCahier  = Literal["brouillon", "valide"]
TypeTest      = Literal["Manuel", "Automatisé"]
StatutTest    = Literal["Non exécuté", "Réussi", "Échoué", "Bloqué"]
ModeGeneration = Literal["ai", "manuelle"]


# ─── Requêtes ─────────────────────────────────────────────────────────────────

class GenererCahierRequest(BaseModel):
    """Corps optionnel pour lancer la génération du cahier de tests global."""
    version: str = Field("1.0.0", description="Numéro de version du cahier")
    mode_generation: ModeGeneration = Field(
        "ai",
        description="Mode de création du cahier: 'ai' pour génération IA, 'manuelle' pour saisie manuelle par le testeur.",
    )


class CreateCasTestRequest(BaseModel):
    """Créer un nouveau cas de test manuel dans le cahier."""
    sprint:           Optional[str] = None
    module:           Optional[str] = None
    sous_module:      Optional[str] = None
    test_case:        str
    test_purpose:     Optional[str] = None
    type_utilisateur: Optional[str] = None
    scenario_test:    Optional[str] = None
    resultat_attendu: Optional[str] = None
    execution_time_seconds: Optional[int] = None
    type_test:        TypeTest = Field("Manuel", description="Type du cas de test")
    commentaire:      Optional[str] = None


class UpdateCasTestRequest(BaseModel):
    """Modifier un cas de test (modification manuelle ou résultat d'exécution)."""
    sprint:           Optional[str]       = None
    module:           Optional[str]       = None
    sous_module:      Optional[str]       = None
    test_case:        Optional[str]       = None
    test_purpose:     Optional[str]       = None
    type_utilisateur: Optional[str]       = None
    scenario_test:    Optional[str]       = None
    resultat_attendu: Optional[str]       = None
    resultat_obtenu:  Optional[str]       = None
    execution_time_seconds: Optional[int] = None
    fail_logs:        Optional[str]       = None
    capture:          Optional[str]       = None
    type_test:        Optional[TypeTest]  = None
    statut_test:      Optional[StatutTest]= None
    commentaire:      Optional[str]       = None
    bug_titre_correction: Optional[str]   = None
    bug_nom_tache: Optional[str]          = None


class ValiderCahierRequest(BaseModel):
    """Valider le cahier de tests (passage en statut 'valide')."""
    version: Optional[str] = Field(None, description="Nouvelle version lors de la validation")


class BugSuggestionResponse(BaseModel):
    bug_titre_correction: str
    bug_nom_tache: str


class AssignableMemberResponse(BaseModel):
    id: int
    nom: str
    email: str
    role_code: str


class ImportExcelResponse(BaseModel):
    imported_count: int
    skipped_count: int
    error_count: int
    skipped_refs: List[str] = []
    errors: List[str] = []


class CasTestHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cas_test_id: int
    cahier_id: int
    changed_by_id: Optional[int]
    old_statut_test: Optional[str]
    new_statut_test: Optional[str]
    old_type_test: Optional[str]
    new_type_test: Optional[str]
    old_commentaire: Optional[str]
    new_commentaire: Optional[str]
    old_bug_titre_correction: Optional[str]
    new_bug_titre_correction: Optional[str]
    old_bug_nom_tache: Optional[str]
    new_bug_nom_tache: Optional[str]
    changed_at: datetime


# ─── Réponses ─────────────────────────────────────────────────────────────────

class CasTestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:               int
    cahier_id:        int
    sprint:           Optional[str]
    module:           Optional[str]
    sous_module:      Optional[str]
    test_ref:         str
    test_case:        str
    test_purpose:     Optional[str]
    type_utilisateur: Optional[str]
    scenario_test:    Optional[str]
    resultat_attendu: Optional[str]
    resultat_obtenu:  Optional[str]
    execution_time_seconds: Optional[int]
    fail_logs:        Optional[str]
    capture:          Optional[str]
    date_creation:    datetime
    type_test:        str
    statut_test:      str
    commentaire:      Optional[str]
    bug_titre_correction: Optional[str]
    bug_nom_tache: Optional[str]
    ordre:            int


class CahierTestGlobalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:               int
    projet_id:        int
    version:          str
    statut:           str
    date_generation:  datetime
    nombre_total:     int
    nombre_reussi:    int
    nombre_echoue:    int
    nombre_bloque:    int
    ai_generation_id: Optional[int] = None


class CahierTestGlobalDetailResponse(CahierTestGlobalResponse):
    """Réponse complète avec la liste des cas de tests."""
    cas_tests: List[CasTestResponse] = []


class StatistiquesResponse(BaseModel):
    version:            str
    nombre_total:       int
    nombre_reussi:      int
    nombre_echoue:      int
    nombre_bloque:      int
    nombre_non_execute: int
    pct_reussi:         float
    pct_echoue:         float
    pct_bloque:         float
    pct_non_execute:    float


# ─── Structure JSON attendue de l'IA ─────────────────────────────────────────

class AICasTest(BaseModel):
    """Un cas de test tel que retourné par le modèle IA."""
    sprint:           str  = ""
    module:           str  = ""
    sous_module:      str  = ""
    test_ref:         str  = ""
    test_case:        str  = ""
    test_purpose:     str  = ""
    type_utilisateur: str  = ""
    scenario_test:    str  = ""
    resultat_attendu: str  = ""
    type_test:        str  = "Manuel"


class AICahierResponse(BaseModel):
    """Réponse complète de l'IA pour la génération du cahier de tests."""
    cas_tests: List[AICasTest] = []
