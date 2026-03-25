"""
Dépendances FastAPI pour l'authentification et l'autorisation
"""
from typing import Annotated
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from starlette import status

from db.database import get_db
from models.user import Utilisateur
from core.config import SECRET_KEY, ALGORITHM

oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]) -> int:
    """Décode le JWT et retourne l'user_id."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")
        return int(user_id)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")


async def get_current_user_entity(
    db: Annotated[Session, Depends(get_db)],
    user_id: Annotated[int, Depends(get_current_user)],
) -> Utilisateur:
    """Récupère l'utilisateur courant à partir du JWT."""
    user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé",
        )
    return user


async def get_current_user_with_role(
    db: Annotated[Session, Depends(get_db)],
    user_id: Annotated[int, Depends(get_current_user)]
) -> Utilisateur:
    """Récupère l'utilisateur courant avec son rôle et permissions"""
    user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    if not user.actif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte utilisateur désactivé"
        )
    return user
