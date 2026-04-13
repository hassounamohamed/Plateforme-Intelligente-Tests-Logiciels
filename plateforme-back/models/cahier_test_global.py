"""
Modèles SQLAlchemy pour le Cahier de Tests Global.

Tables :
  - cahier_test_global : un cahier par projet (global)
  - cas_test           : chaque cas de test généré par l'IA ou créé manuellement
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from db.database import Base


class CahierTestGlobal(Base):
    __tablename__ = "cahier_test_global"

    id = Column(Integer, primary_key=True, index=True)

    projet_id    = Column(Integer, ForeignKey("projet.id", ondelete="CASCADE"), nullable=False, unique=True)
    version      = Column(String(20), default="1.0.0", nullable=False)
    statut       = Column(String(30), default="brouillon", nullable=False)
    # brouillon | valide | generating | failed

    date_generation = Column(DateTime, default=datetime.utcnow)
    generated_by_id = Column(Integer, ForeignKey("utilisateur.id", ondelete="SET NULL"), nullable=True)

    # Lien vers le job de génération IA courant (ai_generations)
    ai_generation_id = Column(Integer, ForeignKey("ai_generations.id", ondelete="SET NULL"), nullable=True)

    # Stats calculées à la génération (mise à jour automatiquement)
    nombre_total  = Column(Integer, default=0)
    nombre_reussi = Column(Integer, default=0)
    nombre_echoue = Column(Integer, default=0)
    nombre_bloque = Column(Integer, default=0)

    # ── Relations ──────────────────────────────────────────────────────────
    projet        = relationship("Projet",        foreign_keys=[projet_id])
    generateur    = relationship("Utilisateur",   foreign_keys=[generated_by_id])
    ai_generation = relationship("AIGeneration",  foreign_keys=[ai_generation_id])
    cas_tests     = relationship(
        "CasTest",
        back_populates="cahier",
        cascade="all, delete-orphan",
        order_by="CasTest.ordre",
    )
    rapport_qa = relationship("RapportQA", back_populates="cahier", uselist=False, cascade="all, delete-orphan")


class CasTest(Base):
    __tablename__ = "cas_test"

    id        = Column(Integer, primary_key=True, index=True)
    cahier_id = Column(Integer, ForeignKey("cahier_test_global.id", ondelete="CASCADE"), nullable=False)
    user_story_id = Column(Integer, ForeignKey("userstory.id"), nullable=False)

    sprint           = Column(String(100), nullable=True)
    module           = Column(String(200), nullable=True)
    sous_module      = Column(String(200), nullable=True)
    test_ref         = Column(String(30),  nullable=False)   # TC-001
    test_case        = Column(String(500), nullable=False)
    test_purpose     = Column(Text,        nullable=True)
    type_utilisateur = Column(String(100), nullable=True)
    scenario_test    = Column(Text,        nullable=True)
    resultat_attendu = Column(Text,        nullable=True)

    # Champs remplis lors de l'exécution (vides par défaut)
    resultat_obtenu = Column(Text,    nullable=True)
    fail_logs       = Column(Text,    nullable=True)
    capture         = Column(String,  nullable=True)
    execution_time_seconds = Column(Integer, nullable=True)
    bug_titre_correction = Column(String(255), nullable=True)
    bug_nom_tache        = Column(String(255), nullable=True)

    date_creation   = Column(DateTime, default=datetime.utcnow)
    type_test       = Column(String(20), default="Manuel", nullable=False)   # Manuel | Automatisé
    statut_test     = Column(String(30), default="Non exécuté", nullable=False)
    # Non exécuté | Réussi | Échoué | Bloqué
    commentaire     = Column(Text, nullable=True)
    ordre           = Column(Integer, default=0)

    # ── Relations ──────────────────────────────────────────────────────────
    cahier = relationship("CahierTestGlobal", back_populates="cas_tests")
    user_story = relationship("UserStory", back_populates="cas_tests")
    history_entries = relationship(
        "CasTestHistory",
        back_populates="cas_test",
        cascade="all, delete-orphan",
        order_by="CasTestHistory.changed_at.desc()",
    )


class CasTestHistory(Base):
    __tablename__ = "cas_test_history"

    id = Column(Integer, primary_key=True, index=True)
    cas_test_id = Column(Integer, ForeignKey("cas_test.id", ondelete="CASCADE"), nullable=False)
    cahier_id = Column(Integer, ForeignKey("cahier_test_global.id", ondelete="CASCADE"), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("utilisateur.id", ondelete="SET NULL"), nullable=True)

    old_statut_test = Column(String(30), nullable=True)
    new_statut_test = Column(String(30), nullable=True)
    old_type_test = Column(String(20), nullable=True)
    new_type_test = Column(String(20), nullable=True)
    old_commentaire = Column(Text, nullable=True)
    new_commentaire = Column(Text, nullable=True)
    old_bug_titre_correction = Column(String(255), nullable=True)
    new_bug_titre_correction = Column(String(255), nullable=True)
    old_bug_nom_tache = Column(String(255), nullable=True)
    new_bug_nom_tache = Column(String(255), nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    cas_test = relationship("CasTest", back_populates="history_entries")
    cahier = relationship("CahierTestGlobal")
    changed_by = relationship("Utilisateur")
