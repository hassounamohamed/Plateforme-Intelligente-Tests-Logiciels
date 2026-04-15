from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

ModeGenerationRapport = Literal["ai", "manuelle"]


class GenererRapportQARequest(BaseModel):
    version: Optional[str] = Field(None, description="Version du rapport QA (ex: 1.0.0)")
    mode_generation: ModeGenerationRapport = Field(
        "manuelle",
        description="Mode de generation du rapport QA: 'manuelle' ou 'ai'.",
    )
    recommandations: Optional[str] = Field(None, description="Recommandations manuelles (mode manuelle)")


class UpdateRapportQARequest(BaseModel):
    version: Optional[str] = None
    statut: Optional[str] = None
    recommandations: Optional[str] = None


class IndicateurQualiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tauxCouverture: Optional[float]
    tauxReussite: Optional[float]
    nombreAnomalies: int
    nombreAnomaliesCritiques: int
    indiceQualite: Optional[float]
    tendance: Optional[str]


class RecommandationQualiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titre: Optional[str]
    description: Optional[str]
    categorie: Optional[str]
    priorite: Optional[str]
    impact: Optional[float]
    statut: Optional[str]


class RapportTrendPointResponse(BaseModel):
    label: str
    exec: int
    fail: int


class RapportQAResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cahierId: int
    version: str
    dateGeneration: datetime
    statut: Optional[str]
    tauxReussite: Optional[float]
    nombreTestsExecutes: int
    nombreTestsReussis: int
    nombreTestsEchoues: int
    nombreTestsBloques: int = 0
    nombreTestsTotal: int = 0
    nombreTestsNonExecutes: int = 0
    passRate: float = 0.0
    coverageRate: float = 0.0
    qualityIndex: float = 0.0
    trendDisplay: str = "Stable"
    decisionRelease: str = "NO GO"
    observationMessage: str = ""
    recommendationLines: List[str] = Field(default_factory=list)
    trendData: List[RapportTrendPointResponse] = Field(default_factory=list)
    recommandations: Optional[str]
    indicateurs: Optional[IndicateurQualiteResponse] = None
    recommandations_qualite: List[RecommandationQualiteResponse] = Field(default_factory=list)
