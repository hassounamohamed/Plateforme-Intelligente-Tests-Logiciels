from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base
from db.associations import sprint_userstory, projet_membre


class Projet(Base):
    __tablename__ = "projet"

    id = Column(Integer, primary_key=True)
    nom = Column(String)
    key = Column(String(10), unique=True, nullable=False)  # ex: PROJ, CRM
    issue_counter = Column(Integer, default=0, nullable=False)  # compteur global des issues
    description = Column(Text)
    dateDebut = Column(DateTime, nullable=True)
    dateFin = Column(DateTime, nullable=True)
    objectif = Column(Text)
    statut = Column(String)

    productOwnerId = Column(Integer, ForeignKey("utilisateur.id"))
    
    # Relations
    product_owner = relationship("Utilisateur", back_populates="projets", foreign_keys=[productOwnerId])
    membres = relationship("Utilisateur", secondary=projet_membre, backref="projets_membres")
    modules = relationship("Module", back_populates="projet", cascade="all, delete-orphan")
    sprints = relationship("Sprint", back_populates="projet", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="projet", cascade="all, delete-orphan",
                               foreign_keys="Attachment.projet_id")


class Module(Base):
    __tablename__ = "module"

    id = Column(Integer, primary_key=True)
    nom = Column(String)
    description = Column(Text)
    ordre = Column(Integer, default=0)

    projet_id = Column(Integer, ForeignKey("projet.id"))
    
    # Relations
    projet = relationship("Projet", back_populates="modules")
    epics = relationship("Epic", back_populates="module", cascade="all, delete-orphan")


class Epic(Base):
    __tablename__ = "epic"

    id = Column(Integer, primary_key=True)
    reference = Column(String(20), nullable=True)  # ex: PROJ-1
    titre = Column(String)
    description = Column(Text)
    priorite = Column(Integer, default=0)
    businessValue = Column(String)
    statut = Column(String)
    dateCreation = Column(DateTime, default=datetime.utcnow)

    module_id = Column(Integer, ForeignKey("module.id"))
    productOwnerId = Column(Integer, ForeignKey("utilisateur.id"))

    # Relations
    module = relationship("Module", back_populates="epics")
    product_owner = relationship("Utilisateur", back_populates="epics", foreign_keys=[productOwnerId])
    userstories = relationship("UserStory", back_populates="epic", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="epic", cascade="all, delete-orphan",
                               foreign_keys="Attachment.epic_id")


class UserStory(Base):
    __tablename__ = "userstory"

    id = Column(Integer, primary_key=True)
    reference = Column(String(20), nullable=True)  # ex: PROJ-4
    titre = Column(String)
    description = Column(Text)
    criteresAcceptation = Column(Text)
    points = Column(Integer, nullable=True)          # Story points Fibonacci
    duree_estimee = Column(Float, nullable=True)     # Durée estimée en heures
    start_date = Column(DateTime, nullable=True)     # Date de début
    due_date = Column(DateTime, nullable=True)       # Date d'échéance
    priorite = Column(String)
    statut = Column(String)
    ordre = Column(Integer, default=0)   # position dans le backlog (drag & drop)

    epic_id = Column(Integer, ForeignKey("epic.id"))
    developerId = Column(Integer, ForeignKey("utilisateur.id"))
    testerId = Column(Integer, ForeignKey("utilisateur.id"), nullable=True)

    # Relations
    epic = relationship("Epic", back_populates="userstories")
    developer = relationship("Utilisateur", back_populates="userstories", foreign_keys=[developerId])
    tester = relationship("Utilisateur", back_populates="userstories_tester", foreign_keys=[testerId])
    sprints = relationship("Sprint", secondary=sprint_userstory, back_populates="userstories")
    cahier_tests = relationship("CahierDeTests", back_populates="userstory", uselist=False, cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="userstory", cascade="all, delete-orphan",
                               foreign_keys="Attachment.userstory_id")


class Sprint(Base):
    __tablename__ = "sprint"

    id = Column(Integer, primary_key=True)
    nom = Column(String)
    dateDebut = Column(DateTime, nullable=True)
    dateFin = Column(DateTime, nullable=True)
    objectifSprint = Column(Text)
    capaciteEquipe = Column(Integer)
    velocite = Column(Integer, default=0)
    statut = Column(String)

    projet_id = Column(Integer, ForeignKey("projet.id"))
    scrumMasterId = Column(Integer, ForeignKey("utilisateur.id"))

    # Relations
    projet = relationship("Projet", back_populates="sprints")
    scrum_master = relationship("Utilisateur", back_populates="sprints_scrum_master", foreign_keys=[scrumMasterId])
    userstories = relationship("UserStory", secondary=sprint_userstory, back_populates="sprints")
    rapport_qa = relationship("RapportQA", back_populates="sprint", uselist=False, cascade="all, delete-orphan")

