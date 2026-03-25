import os
from dotenv import load_dotenv

load_dotenv()

# ── Base config ──────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ── Encryption ───────────────────────────────────────────────────────────────
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

# ── Environment ──────────────────────────────────────────────────────────────
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# ── AI Configuration ─────────────────────────────────────────────────────────
AI_API_KEY = os.getenv("AI_API_KEY")
AI_MODEL = os.getenv("AI_MODEL", "google/gemma-3-12b-it")
AI_API_URL = os.getenv("AI_API_URL", "https://openrouter.ai/api/v1/chat/completions")

# ── Email / Reset Password ───────────────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
FRONTEND_RESET_PASSWORD_PATH = os.getenv("FRONTEND_RESET_PASSWORD_PATH", "/auth/reset-password")

# ── OAuth Configuration ──────────────────────────────────────────────────────
SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", SECRET_KEY or "change-me-in-production")
SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "pilt_backend_session")
SESSION_SAME_SITE = os.getenv("SESSION_SAME_SITE", "lax")

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")

# GitHub OAuth
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "")