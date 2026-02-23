"""
Dépendances FastAPI pour l'authentification et l'autorisation
"""
from typing import Annotated
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from starlette import status

from db.database import get_db
from models.user import Utilisateur
from api.auth import get_current_user


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
