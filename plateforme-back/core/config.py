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
