from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from core.config import ENVIRONMENT
from db.database import engine, get_db, Base

# Import all models to register them with SQLAlchemy
from models import (
    Utilisateur, Role, Permission,
    Projet, Module, Epic, UserStory, Sprint,
    Attachment,
    CahierDeTests, Test, TestUnitaire, TestAutomatise, TestManuel, ScenarioTest, ValidationTest,
    ExecutionTest, ResultatTest,
    Anomalie,
    RapportQA, IndicateurQualite, RecommandationQualite,
    Notification, TypeNotification,
    LogSystems, AuditLog,
    AIGeneration, AILog, AIGeneratedItem,
    CahierTestGlobal, CasTest,
)

# Import routes
from api.auth import router as auth_router
from api.roles import router as roles_router
from api.logs import router as logs_router
from api.users import router as users_router
from api.projets import router as projets_router
from api.modules import router as modules_router
from api.epics import router as epics_router
from api.userstories import router as userstories_router
from api.sprints import router as sprints_router
from api.backlog import router as backlog_router
from api.attachments import router as attachments_router
from api.ai_generation import router as ai_generation_router
from api.cahier_test_global import router as cahier_test_global_router



app = FastAPI(
    title="Plateforme Intelligente Tests Logiciels",
    description="API pour la gestion intelligente des tests logiciels avec approche Scrum",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTPS enforcement (production uniquement)
# En dev : mettre ENVIRONMENT=development dans .env pour désactiver
if ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"],  # Restreindre en prod : ["mondomaine.com", "www.mondomaine.com"]
    )


# 🔹 Initialize database and create tables on startup
@app.on_event("startup")
def startup():
    try:
        # Test database connection
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("[OK] Database connection successful!")
        print(f"[OK] Connected to: {engine.url.database}")
        
        # Create all tables (will only create new ones, skip existing)
        Base.metadata.create_all(bind=engine)
        print("[OK] All database tables created successfully!")
        
        
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")
        raise


# Simple test route
@app.get("/")
def read_root():
    return {"message": "FastAPI is running"}


# Include routers
app.include_router(auth_router)
app.include_router(roles_router)
app.include_router(logs_router)
app.include_router(users_router)
app.include_router(projets_router)
app.include_router(modules_router)
app.include_router(epics_router)
app.include_router(userstories_router)
app.include_router(sprints_router)
app.include_router(backlog_router)
app.include_router(attachments_router)
app.include_router(ai_generation_router)
app.include_router(cahier_test_global_router)

# Test DB route
@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1"))
    return {"status": "Database connected successfully"}
