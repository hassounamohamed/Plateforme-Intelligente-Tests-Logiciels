from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base


class Attachment(Base):
    __tablename__ = "attachment"

    id = Column(Integer, primary_key=True)
    filename = Column(String, nullable=False)       # nom original du fichier
    filepath = Column(String, nullable=False)       # chemin sur disque
    content_type = Column(String, nullable=False)   # MIME type
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    uploaded_by_id = Column(Integer, ForeignKey("utilisateur.id"), nullable=True)

    # Un seul de ces champs est non-null (clé étrangère polymorphique simplifiée)
    projet_id     = Column(Integer, ForeignKey("projet.id",     ondelete="CASCADE"), nullable=True)
    epic_id       = Column(Integer, ForeignKey("epic.id",       ondelete="CASCADE"), nullable=True)
    userstory_id  = Column(Integer, ForeignKey("userstory.id",  ondelete="CASCADE"), nullable=True)

    # Relations
    uploaded_by = relationship("Utilisateur", foreign_keys=[uploaded_by_id])
    projet      = relationship("Projet",     back_populates="attachments", foreign_keys=[projet_id])
    epic        = relationship("Epic",       back_populates="attachments", foreign_keys=[epic_id])
    userstory   = relationship("UserStory",  back_populates="attachments", foreign_keys=[userstory_id])
