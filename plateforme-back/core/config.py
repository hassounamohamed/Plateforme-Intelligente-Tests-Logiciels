import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_o6avbkAJyWY8@ep-super-moon-ag8uanbl-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
