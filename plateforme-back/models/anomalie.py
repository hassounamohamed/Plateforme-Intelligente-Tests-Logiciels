from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base


class Anomalie(Base):
    __tablename__ = "anomalie"

    id = Column(Integer, primary_key=True)
    titre = Column(String)
    description = Column(Text)
    severite = Column(String)
    statut = Column(String)
    priorite = Column(String)
    dateCreation = Column(DateTime, default=datetime.utcnow)
    dateResolution = Column(DateTime, nullable=True)

    resultat_id = Column(Integer, ForeignKey("resultat_test.id"), nullable=True)
    cas_test_id = Column(Integer, ForeignKey("cas_test.id", ondelete="CASCADE"), nullable=True)
    reporterId = Column(Integer, ForeignKey("utilisateur.id"))
    assignedTo = Column(Integer, ForeignKey("utilisateur.id"), nullable=True)

    # Relations
    resultat = relationship("ResultatTest", back_populates="anomalies")
    cas_test = relationship("CasTest", back_populates="anomalies")
    reporter = relationship("Utilisateur", back_populates="anomalies_reportees", foreign_keys=[reporterId])
    assigned = relationship("Utilisateur", back_populates="anomalies_assignees", foreign_keys=[assignedTo])

