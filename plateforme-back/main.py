from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
import time

from core.config import ENVIRONMENT, SESSION_COOKIE_NAME, SESSION_SAME_SITE, SESSION_SECRET_KEY
from db.database import engine, get_db, Base, SessionLocal

# Import all models to register them with SQLAlchemy
from models import (
    Utilisateur, Role, Permission,
    Projet, Epic, UserStory, Sprint,
    Attachment,
    CahierDeTests, Test, TestUnitaire, TestAutomatise, TestManuel, ScenarioTest, ValidationTest,
    ExecutionTest, ResultatTest,
    Anomalie,
    RapportQA, IndicateurQualite, RecommandationQualite,
    Notification, TypeNotification,
    LogSystems, AuditLog,
    AIGeneration, AILog, AIGeneratedItem,
    CahierTestGlobal, CasTest,
    PasswordResetToken,
)

# Import routes
from api.auth import router as auth_router
from api.roles import router as roles_router
from api.logs import router as logs_router
from api.users import router as users_router
from api.projets import router as projets_router
from api.epics import router as epics_router
from api.userstories import router as userstories_router
from api.sprints import router as sprints_router
from api.backlog import router as backlog_router
from api.attachments import router as attachments_router
from api.ai_generation import router as ai_generation_router
from api.cahier_test_global import router as cahier_test_global_router
from api.rapport import router as rapport_router
from api.anomalies import (
    router as anomalies_router,
    cas_router as anomalies_cas_router,
    legacy_cas_router as anomalies_legacy_cas_router,
)
from api.notifications import router as notifications_router
from api.unit_tests import router as unit_tests_router
from api.dashboard import router as dashboard_router
from api.product_owner_dashboard import router as product_owner_dashboard_router
from api.contact import router as contact_router


app = FastAPI(
    title="Plateforme Intelligente Tests Logiciels",
    description="API pour la gestion intelligente des tests logiciels avec approche Scrum",
    version="1.0.0"
)


@app.middleware("http")
async def log_system_requests(request: Request, call_next):
    start = time.perf_counter()
    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception as exc:
        status_code = 500
        _write_system_log(
            niveau="ERROR",
            message=f"HTTP {request.method} {request.url.path} -> 500",
            details=str(exc),
        )
        raise
    else:
        duration_ms = (time.perf_counter() - start) * 1000
        if status_code >= 500:
            level = "ERROR"
        elif status_code >= 400:
            level = "WARNING"
        else:
            level = "INFO"

        details = (
            f"status={status_code} method={request.method} path={request.url.path} "
            f"duration_ms={duration_ms:.2f}"
        )
        _write_system_log(
            niveau=level,
            message=f"HTTP {request.method} {request.url.path} -> {status_code}",
            details=details,
        )
        return response


def _write_system_log(niveau: str, message: str, details: str | None = None) -> None:
    try:
        from models.log_systems import LogSystems

        db = SessionLocal()
        db.add(
            LogSystems(
                niveau=niveau,
                message=message,
                source="api",
                details=details,
            )
        )
        db.commit()
    except Exception:
        # Avoid breaking requests if logging fails.
        pass
    finally:
        try:
            db.close()
        except Exception:
            pass

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET_KEY,
    https_only=(ENVIRONMENT == "production"),
    same_site=SESSION_SAME_SITE,
    session_cookie=SESSION_COOKIE_NAME,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:19006",
        "http://51.255.202.68:8081",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
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
        try:
            Base.metadata.create_all(bind=engine)
            print("[OK] All database tables created successfully!")
        except ProgrammingError as pe:
            err = str(pe).lower()
            if "permission denied for schema" in err or "insufficientprivilege" in err:
                print("[WARNING] Missing CREATE privilege on schema 'public'.")
                print("[WARNING] Auto table creation skipped. Apply migration with a privileged DB user.")
            else:
                raise

    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")
        raise


# Simple test route
@app.get("/")
def read_root():
    return {"message": "FastAPI is running"}


@app.get("/health")
def health_check():
    status = "OK"
    db_status = "OK"
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        status = "DEGRADED"
        db_status = "ERROR"

    return {
        "status": status,
        "db": db_status,
    }


# Include routers
app.include_router(auth_router)
app.include_router(roles_router)
app.include_router(logs_router)
app.include_router(users_router)
app.include_router(projets_router)
app.include_router(epics_router)
app.include_router(userstories_router)
app.include_router(sprints_router)
app.include_router(backlog_router)
app.include_router(attachments_router)
app.include_router(ai_generation_router)
app.include_router(cahier_test_global_router)
app.include_router(rapport_router)
app.include_router(anomalies_router)
app.include_router(anomalies_cas_router)
app.include_router(anomalies_legacy_cas_router)
app.include_router(notifications_router)
app.include_router(unit_tests_router)
app.include_router(dashboard_router)
app.include_router(product_owner_dashboard_router)
app.include_router(contact_router)
# Test DB route
@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1"))
    return {"status": "Database connected successfully"}
