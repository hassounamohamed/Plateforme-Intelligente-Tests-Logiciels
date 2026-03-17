from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.user import UserCreate, UserResponse, Token, UserLogin
from services.auth_service import AuthService
from db.session import get_db
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
        user_data: UserCreate,
        db: AsyncSession = Depends(get_db)
):
    """
    Créer un nouveau compte utilisateur
    """
    auth_service = AuthService(db)

    # Vérifier si l'utilisateur existe déjà
    existing_user = await auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un utilisateur avec cet email existe déjà"
        )

    # Vérifier si le username est déjà pris
    existing_username = await auth_service.get_user_by_username(user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un utilisateur avec ce nom d'utilisateur existe déjà"
        )

    # Créer l'utilisateur (avec gestion d'erreur pour obtenir un message de debug)
    try:
        user = await auth_service.create_user(user_data)
    except Exception as exc:
        # Log the full exception with traceback for debugging and return a sanitized error to the client
        logger.exception("Erreur lors de la création d'un utilisateur: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne lors de la création de l'utilisateur"
        )

    # Log confirmation
    try:
        logger.info("Nouvel utilisateur enregistré: id=%s email=%s username=%s", user.id, user.email, user.username)
    except Exception:
        print(f"Nouvel utilisateur enregistré: id={user.id} email={user.email} username={user.username}")

    return user


@router.post("/login", response_model=Token)
async def login(
        user_credentials: UserLogin,
        db: AsyncSession = Depends(get_db)
):
    """
    Connexion utilisateur et génération du token JWT
    """
    auth_service = AuthService(db)

    # Authentifier l'utilisateur
    user = await auth_service.authenticate_user(
        user_credentials.email,
        user_credentials.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Générer le token
    access_token = auth_service.create_access_token(data={"sub": user.email, "id": user.id})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/token", response_model=Token)
async def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: AsyncSession = Depends(get_db)
):
    """
    Endpoint OAuth2 standard pour obtenir un token
    """
    auth_service = AuthService(db)

    user = await auth_service.authenticate_user(form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth_service.create_access_token(data={"sub": user.email, "id": user.id})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user(
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Récupérer les informations de l'utilisateur connecté
    """
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_email(current_user["email"])

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    return user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
        user_update: UserCreate,
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Mettre à jour les informations de l'utilisateur connecté
    """
    auth_service = AuthService(db)
    user = await auth_service.update_user(current_user["id"], user_update)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    return user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
        db: AsyncSession = Depends(get_db),
        current_user: dict = Depends(AuthService.get_current_user)
):
    """
    Supprimer le compte de l'utilisateur connecté
    """
    auth_service = AuthService(db)
    await auth_service.delete_user(current_user["id"])
    return None