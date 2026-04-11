from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from db.database import Base


class TypeNotification(str, Enum):
    PROJECT_CREATED = "PROJECT_CREATED"
    PROJECT_UPDATED = "PROJECT_UPDATED"
    PROJECT_ARCHIVED = "PROJECT_ARCHIVED"
    PROJECT_MEMBER_ADDED = "PROJECT_MEMBER_ADDED"
    ADDED_TO_PROJECT = "ADDED_TO_PROJECT"

    USER_STORY_CREATED = "USER_STORY_CREATED"
    USER_STORY_UPDATED = "USER_STORY_UPDATED"
    USER_STORY_DELETED = "USER_STORY_DELETED"
    USER_STORY_VALIDATED = "USER_STORY_VALIDATED"
    USER_STORY_ASSIGNED_TO_ME = "USER_STORY_ASSIGNED_TO_ME"

    SPRINT_CREATED = "SPRINT_CREATED"
    TEST_FAILED = "TEST_FAILED"
    TEST_PASSED = "TEST_PASSED"
    SPRINT_STARTED = "SPRINT_STARTED"
    SPRINT_ENDED = "SPRINT_ENDED"
    SPRINT_COMPLETED = "SPRINT_COMPLETED"
    USER_STORY_ADDED_TO_SPRINT = "USER_STORY_ADDED_TO_SPRINT"
    USER_STORY_REMOVED_FROM_SPRINT = "USER_STORY_REMOVED_FROM_SPRINT"
    BACKLOG_UPDATED = "BACKLOG_UPDATED"

    TEST_CREATED = "TEST_CREATED"
    TEST_ASSIGNED_TO_ME = "TEST_ASSIGNED_TO_ME"
    TEST_EXECUTED = "TEST_EXECUTED"
    TEST_RESULT_VALIDATED = "TEST_RESULT_VALIDATED"
    BUG_DETECTED = "BUG_DETECTED"
    REPORT_EXPORTED = "REPORT_EXPORTED"
    AI_FAILED = "AI_FAILED"
    DEADLINE_NEAR = "DEADLINE_NEAR"
    SPRINT_DELAYED = "SPRINT_DELAYED"
    NEW_ASSIGNMENT = "NEW_ASSIGNMENT"

    REPORT_GENERATED = "REPORT_GENERATED"
    ANOMALY_CREATED = "ANOMALY_CREATED"
    VALIDATION_REQUIRED = "VALIDATION_REQUIRED"
    RECOMMENDATION_AVAILABLE = "RECOMMENDATION_AVAILABLE"


class Notification(Base):
    __tablename__ = "notification"

    id = Column(Integer, primary_key=True)
    titre = Column(String)
    message = Column(Text)
    type = Column(SQLEnum(TypeNotification))
    dateEnvoi = Column(DateTime, default=datetime.utcnow)
    lue = Column(Boolean, default=False)
    priorite = Column(String)

    destinataireId = Column(Integer, ForeignKey("utilisateur.id"))

    # Relations
    destinataire = relationship("Utilisateur", back_populates="notifications", foreign_keys=[destinataireId])
