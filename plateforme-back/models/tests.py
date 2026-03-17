from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base


class CahierDeTests(Base):
    __tablename__ = "cahier_tests"

    id = Column(Integer, primary_key=True)
    dateGeneration = Column(DateTime, default=datetime.utcnow)
    statut = Column(String)
    nombreTests = Column(Integer, default=0)

    userstory_id     = Column(Integer, ForeignKey("userstory.id"))
    ai_generation_id = Column(Integer, ForeignKey("ai_generations.id", ondelete="SET NULL"), nullable=True)

    # Relations
    userstory = relationship("UserStory", back_populates="cahier_tests")
    tests = relationship("Test", back_populates="cahier", cascade="all, delete-orphan")


class Test(Base):
    __tablename__ = "test"

    id = Column(Integer, primary_key=True)
    nom = Column(String)
    description = Column(Text)
    type = Column(String)

    cahier_id = Column(Integer, ForeignKey("cahier_tests.id"))
    userStoryId = Column(Integer, ForeignKey("userstory.id"))

    # Relations
    cahier = relationship("CahierDeTests", back_populates="tests")
    scenarios = relationship("ScenarioTest", back_populates="test", cascade="all, delete-orphan")
    validations = relationship("ValidationTest", back_populates="test", cascade="all, delete-orphan")
    executions = relationship("ExecutionTest", back_populates="test", cascade="all, delete-orphan")

    __mapper_args__ = {
        "polymorphic_on": type,
        "polymorphic_identity": "test",
    }


class TestUnitaire(Test):
    __tablename__ = "test_unitaire"
    id = Column(Integer, ForeignKey("test.id"), primary_key=True)

    framework = Column(String)
    langage = Column(String)
    code = Column(Text)
    fichierTest = Column(String)

    __mapper_args__ = {
        "polymorphic_identity": "unitaire",
    }


class TestAutomatise(Test):
    __tablename__ = "test_automatise"
    id = Column(Integer, ForeignKey("test.id"), primary_key=True)

    framework = Column(String)
    typeTest = Column(String)
    outil = Column(String)
    dateGeneration = Column(DateTime, default=datetime.utcnow)

    __mapper_args__ = {
        "polymorphic_identity": "automatise",
    }


class TestManuel(Test):
    __tablename__ = "test_manuel"
    id = Column(Integer, ForeignKey("test.id"), primary_key=True)

    etapes = Column(Text)
    donneeTest = Column(Text)
    tempEstime = Column(Integer)

    __mapper_args__ = {
        "polymorphic_identity": "manuel",
    }


class ScenarioTest(Base):
    __tablename__ = "scenario_test"

    id = Column(Integer, primary_key=True)
    nom = Column(String)
    description = Column(Text)
    type = Column(String)

    test_id = Column(Integer, ForeignKey("test.id"))

    # Relations
    test = relationship("Test", back_populates="scenarios")


class ValidationTest(Base):
    __tablename__ = "validation_test"

    id = Column(Integer, primary_key=True)
    dateValidation = Column(DateTime, default=datetime.utcnow)
    statut = Column(String)
    decision = Column(String)
    commentaires = Column(Text)
    goNoGo = Column(Boolean, default=False)

    testId = Column(Integer, ForeignKey("test.id"))
    validatorId = Column(Integer, ForeignKey("utilisateur.id"))

    # Relations
    test = relationship("Test", back_populates="validations")
    validateur = relationship("Utilisateur", back_populates="validations", foreign_keys=[validatorId])
