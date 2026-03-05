import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://neondb_owner:npg_o6avbkAJyWY8@ep-super-moon-ag8uanbl-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Clé Fernet pour le chiffrement des données sensibles (AES-128-CBC + HMAC-SHA256)
# Générer une nouvelle clé : python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# OBLIGATOIRE en production : définir la variable d'environnement ENCRYPTION_KEY
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "7no5-U0UKJfchPw69MmORHrP8z3YLNZbWSX0iQazeCI=")

# Environnement : development | production
# En production, HTTPS est enforced via HTTPSRedirectMiddleware
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# ── Configuration IA (Google AI Studio) ─────────────────────────────────────
AI_API_KEY = os.getenv("ai_api_key", "")
AI_MODEL   = os.getenv("ai_model",   "gemini-2.0-flash")
