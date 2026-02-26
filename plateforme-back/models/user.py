from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base
from db.associations import role_permission
from core.encryption import EncryptedString


class Utilisateur(Base):
    __tablename__ = "utilisateur"

    id = Column(Integer, primary_key=True)
    nom = Column(String)
    email = Column(String, unique=True)
    motDePasse = Column(String)
    telephone = Column(EncryptedString)  # chiffre en base (Fernet)
    dateCreation = Column(DateTime, default=datetime.utcnow)
    derniereConnexion = Column(DateTime, nullable=True)
    actif = Column(Boolean, default=False)

    role_id = Column(Integer, ForeignKey("role.id"))

    # Relations
    role = relationship("Role", back_populates="users")
    
    # Projets et éléments Scrum
    projets = relationship("Projet", back_populates="product_owner", foreign_keys="Projet.productOwnerId")
    epics = relationship("Epic", back_populates="product_owner", foreign_keys="Epic.productOwnerId")
    userstories = relationship("UserStory", back_populates="developer", foreign_keys="UserStory.developerId")
    sprints_scrum_master = relationship("Sprint", back_populates="scrum_master", foreign_keys="Sprint.scrumMasterId")
    
    # Validations
    validations = relationship("ValidationTest", back_populates="validateur", foreign_keys="ValidationTest.validatorId")
    
    # Exécutions
    executions = relationship("ExecutionTest", back_populates="executeur", foreign_keys="ExecutionTest.executeurId")
    
    # Anomalies
    anomalies_reportees = relationship("Anomalie", back_populates="reporter", foreign_keys="Anomalie.reporterId")
    anomalies_assignees = relationship("Anomalie", back_populates="assigned", foreign_keys="Anomalie.assignedTo")
    
    # Notifications
    notifications = relationship("Notification", back_populates="destinataire", foreign_keys="Notification.destinataireId")
    
    # Audit
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.userId")


class Role(Base):
    __tablename__ = "role"

    id = Column(Integer, primary_key=True)
    nom = Column(String)
    code = Column(String)
    description = Column(String)
    niveau_acces = Column(Integer)

    # Relations
    users = relationship("Utilisateur", back_populates="role")
    permissions = relationship("Permission", secondary=role_permission, back_populates="roles")


class Permission(Base):
    __tablename__ = "permission"

    id = Column(Integer, primary_key=True)
    nom = Column(String)
    resource = Column(String)
    action = Column(String)
    description = Column(String)

    # Relations
    roles = relationship("Role", secondary=role_permission, back_populates="permissions")

