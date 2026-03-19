import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Clé Fernet pour le chiffrement des données sensibles (AES-128-CBC + HMAC-SHA256)
# Générer une nouvelle clé : python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# OBLIGATOIRE : définir la variable d'environnement ENCRYPTION_KEY dans .env
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

# Environnement : development | production
# En production, HTTPS est enforced via HTTPSRedirectMiddleware
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# ── Configuration IA (OpenRouter) ─────────────────────────────────────────────
AI_API_KEY = os.getenv("ai_api_key")
AI_MODEL   = os.getenv("ai_model",  "google/gemma-3-12b-it")
AI_API_URL = os.getenv("ai_api_url", "https://openrouter.ai/api/v1/chat/completions")

# ── Email / Reset password configuration ─────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM") or os.getenv("SMTP_FROM_EMAIL", SMTP_USER)
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
FRONTEND_RESET_PASSWORD_PATH = os.getenv("FRONTEND_RESET_PASSWORD_PATH", "/auth/reset-password")
