"""
Modèles SQLAlchemy pour le système de génération IA du backlog Scrum.

Tables :
  - ai_generations      : suivi de chaque job de génération
  - ai_logs             : journal pas-à-pas du processus
  - ai_generated_items  : résultats (epics / user stories) générés
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from db.database import Base


# ─── Job de génération ────────────────────────────────────────────────────────

class AIGeneration(Base):
    __tablename__ = "ai_generations"

    id = Column(Integer, primary_key=True, index=True)

    projet_id = Column(Integer, ForeignKey("projet.id", ondelete="CASCADE"), nullable=False)
    user_id   = Column(Integer, ForeignKey("utilisateur.id", ondelete="SET NULL"), nullable=True)

    # Type de génération : generate_scrum | generate_tests
    type = Column(String(50), nullable=False, default="generate_scrum")

    # Cycle de vie : pending → processing → completed | failed
    # Actions utilisateur : approved | rejected
    status = Column(String(30), nullable=False, default="pending")

    # Progression 0 → 100
    progress = Column(Integer, default=0, nullable=False)

    created_at   = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # ── Relations ──────────────────────────────────────────────────────────
    projet = relationship("Projet",      foreign_keys=[projet_id])
    user   = relationship("Utilisateur", foreign_keys=[user_id])
    logs   = relationship("AILog",           back_populates="generation", cascade="all, delete-orphan")
    items  = relationship("AIGeneratedItem", back_populates="generation", cascade="all, delete-orphan")


# ─── Journal de progression ───────────────────────────────────────────────────

class AILog(Base):
    __tablename__ = "ai_logs"

    id = Column(Integer, primary_key=True, index=True)

    generation_id = Column(Integer, ForeignKey("ai_generations.id", ondelete="CASCADE"), nullable=False)

    # Étape courante : reading_file | sending_prompt | generating_epics | generating_us | saving | done | error
    step    = Column(String(50), nullable=False)
    message = Column(Text, nullable=True)

    # Snapshot de progression à ce moment (10 / 30 / 60 …)
    progress = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    generation = relationship("AIGeneration", back_populates="logs")


# ─── Éléments générés ─────────────────────────────────────────────────────────

class AIGeneratedItem(Base):
    __tablename__ = "ai_generated_items"

    id = Column(Integer, primary_key=True, index=True)

    generation_id = Column(Integer, ForeignKey("ai_generations.id", ondelete="CASCADE"), nullable=False)

    # Type de l'élément : module | epic | user_story
    type = Column(String(30), nullable=False)

    # Pour les user stories : id de l'AIGeneratedItem parent (epic)
    parent_id = Column(Integer, ForeignKey("ai_generated_items.id", ondelete="CASCADE"), nullable=True)

    title       = Column(String(500), nullable=False)
    description = Column(Text,        nullable=True)

    # Champs Scrum enrichis
    acceptance_criteria = Column(Text,    nullable=True)   # JSON array sérialisé
    priority            = Column(String(10), nullable=True)  # High / Medium / Low
    story_points        = Column(Integer, nullable=True)    # 1 → 13
    sprint              = Column(Integer, nullable=True)    # numéro de sprint 1 → 6
    duration            = Column(String(20), nullable=True) # ex: "4h", "8h"

    # Cycle de vie : draft | approved | rejected | modified
    status = Column(String(20), nullable=False, default="draft")

    created_at = Column(DateTime, default=datetime.utcnow)

    # ── Relations ──────────────────────────────────────────────────────────
    generation = relationship("AIGeneration", back_populates="items")
    parent = relationship(
        "AIGeneratedItem",
        back_populates="children",
        foreign_keys="[AIGeneratedItem.parent_id]",
        remote_side="AIGeneratedItem.id",
        uselist=False,
    )
    children = relationship(
        "AIGeneratedItem",
        back_populates="parent",
        foreign_keys="[AIGeneratedItem.parent_id]",
        cascade="all, delete-orphan",
    )


# ─── Journal des interactions IA (prompts / réponses) ─────────────────────────

class AIPromptLog(Base):
    """
    Enregistre chaque échange prompt↔réponse avec un modèle IA.

    Usages :
      - audit et révision des interactions passées
      - réutilisation avec d'autres modèles
      - constitution d'un dataset pour l'amélioration des prompts
    """
    __tablename__ = "ai_prompt_logs"

    id = Column(Integer, primary_key=True, index=True)

    # ── Contexte ───────────────────────────────────────────────────────────
    projet_id = Column(Integer, ForeignKey("projet.id", ondelete="SET NULL"), nullable=True)
    user_id   = Column(Integer, ForeignKey("utilisateur.id", ondelete="SET NULL"), nullable=True)

    # Type de tâche IA : generate_scrum | generate_tests | summarize | classify | …
    action_type = Column(String(80), nullable=False, index=True)

    # ── Contenu de l'échange ───────────────────────────────────────────────
    prompt   = Column(Text, nullable=False)
    response = Column(Text, nullable=True)   # NULL si la requête a échoué

    # ── Méta-données du modèle ─────────────────────────────────────────────
    model_used    = Column(String(100), nullable=True)   # ex: "gpt-4o", "gemini-1.5-pro"
    tokens_used   = Column(Integer,     nullable=True)   # total (prompt + completion)
    response_time = Column(Float,       nullable=True)   # secondes (float pour précision ms)

    # ── Résultat ───────────────────────────────────────────────────────────
    # success | failed | timeout | rate_limited
    status = Column(String(30), nullable=False, default="success", index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ── Relations ──────────────────────────────────────────────────────────
    projet = relationship("Projet",      foreign_keys=[projet_id])
    user   = relationship("Utilisateur", foreign_keys=[user_id])

    # ── Index composites pour les requêtes fréquentes ──────────────────────
    __table_args__ = (
        Index("ix_ai_prompt_logs_projet_created",  "projet_id",  "created_at"),
        Index("ix_ai_prompt_logs_user_created",    "user_id",    "created_at"),
        Index("ix_ai_prompt_logs_action_status",   "action_type", "status"),
    )
