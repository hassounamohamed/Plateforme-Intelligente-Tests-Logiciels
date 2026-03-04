import re
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from pydantic import BaseModel, Field, field_validator, ConfigDict

if TYPE_CHECKING:
    from schemas.attachment import AttachmentResponse


# ─── Requêtes ─────────────────────────────────────────────────────────────────

def _generer_key(nom: str) -> str:
    """Génère la clé projet à partir des initiales du nom (max 10 chars, majuscules)."""
    mots = re.sub(r'[^\w\s]', '', nom).split()
    if len(mots) >= 2:
        key = "".join(m[0] for m in mots if m)
    else:
        key = nom[:4] if len(nom) >= 4 else nom
    return key.upper()[:10]


class CreateProjetRequest(BaseModel):
    nom: str = Field(..., min_length=1, description="Nom du projet")
    key: Optional[str] = Field(
        None,
        description="Clé projet unique (ex: PROJ, CRM). Auto-générée à partir du nom si absente."
    )
    description: Optional[str] = Field(None, description="Description du projet")
    dateDebut: Optional[datetime] = Field(None, description="Date de début")
    dateFin: Optional[datetime] = Field(None, description="Date de fin prévue")
    objectif: Optional[str] = Field(None, description="Objectif principal du projet")

    @field_validator('key', mode='before')
    @classmethod
    def normaliser_key(cls, v):
        if v is None:
            return v
        # Mettre en majuscules + garder uniquement lettres et chiffres
        cleaned = re.sub(r'[^A-Z0-9]', '', str(v).upper())
        if len(cleaned) < 2:
            raise ValueError('La clé projet doit contenir au moins 2 caractères alphanumériques.')
        if len(cleaned) > 10:
            raise ValueError('La clé projet ne peut pas dépasser 10 caractères.')
        return cleaned


class UpdateProjetRequest(BaseModel):
    nom: Optional[str] = Field(None, min_length=1, description="Nouveau nom")
    description: Optional[str] = Field(None, description="Nouvelle description")
    dateDebut: Optional[datetime] = Field(None, description="Date de début")
    dateFin: Optional[datetime] = Field(None, description="Date de fin prévue")
    objectif: Optional[str] = Field(None, description="Objectif principal")
    statut: Optional[str] = Field(None, description="Statut (actif, archivé, ...)")


class AssignerMembresRequest(BaseModel):
    membre_ids: List[int] = Field(..., description="IDs des membres à assigner au projet")


# ─── Réponses ─────────────────────────────────────────────────────────────────

class MembreSimple(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    nom: str
    email: str
    actif: bool = True


class ProjetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    nom: str
    key: Optional[str] = None
    description: Optional[str] = None
    dateDebut: Optional[datetime] = None
    dateFin: Optional[datetime] = None
    objectif: Optional[str] = None
    statut: str
    productOwnerId: int
    membres: List[MembreSimple] = []
    attachments: List["AttachmentResponse"] = []  # Forward reference to avoid circular import

    @field_validator('key', mode='before')
    @classmethod
    def default_key(cls, v, info):
        """Générer une clé si elle est None (pour les projets existants)"""
        if v is None and info.data.get('nom'):
            return _generer_key(info.data['nom'])
        return v or "PROJ"


class ProjetStatistiquesResponse(BaseModel):
    projet_id: int
    nom: str
    nb_sprints: int
    nb_modules: int
    statut: str

# Rebuild ProjetResponse to resolve forward references
# This is done at the end to avoid circular import issues
from schemas.attachment import AttachmentResponse
ProjetResponse.model_rebuild()