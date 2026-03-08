from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set. Add it to your .env file.")

# Optional: refresh token expiry in minutes (e.g., 7 days)
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Password hashing ---
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str):
    return pwd_context.verify(password, hashed)

# --- Access token ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- Refresh token ---
def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
