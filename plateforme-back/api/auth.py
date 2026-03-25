from typing import Annotated
import logging
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from starlette import status

from core.config import FRONTEND_BASE_URL
from db.database import get_db
from schemas.user import CreateUserRequest
from schemas.auth import Token
from schemas.oauth import SelectRoleRequest, SelectRoleResponse
from services.auth_service import AuthService
from services.oauth_service import OAuthService
from schemas.password_reset import (
    MessageResponse,
    RequestResetPasswordRequest,
    ResetPasswordRequest,
)
from services.password_reset_service import PasswordResetService
from core.rbac.dependencies import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)
logger = logging.getLogger(__name__)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_password_reset_service(db: Session = Depends(get_db)) -> PasswordResetService:
    return PasswordResetService(db)


def get_oauth_service(db: Session = Depends(get_db)) -> OAuthService:
    return OAuthService(db)

# ================= SIGN UP =================

# Alias pour compatibilité frontend
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    request: CreateUserRequest,
    svc: AuthService = Depends(get_auth_service),
):
    print(f"[DEBUG] Received registration request: {request.dict()}")
    result = svc.register(request)
    print(f"[DEBUG] Registration successful: {result}")
    return result

# ================= SIGN IN =================
# Alias pour compatibilité frontend
@router.post("/login", response_model=Token)
async def login_user(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    svc: AuthService = Depends(get_auth_service),
):
    ip = request.client.host if request.client else None
    return svc.login(form_data.username, form_data.password, ip_address=ip)


@router.get("/oauth/{provider}/login")
async def oauth_login(
    provider: str,
    request: Request,
    svc: OAuthService = Depends(get_oauth_service),
):
    requested_intent = (request.query_params.get("intent") or "login").strip().lower()
    oauth_intent = "register" if requested_intent == "register" else "login"
    request.session["oauth_intent"] = oauth_intent
    response = await svc.authorize_redirect(provider, request, oauth_intent)
    response.set_cookie(
        key="oauth_intent",
        value=oauth_intent,
        max_age=300,
        httponly=True,
        samesite="lax",
    )
    return response


@router.get("/oauth/{provider}/callback", name="oauth_callback")
async def oauth_callback(
    provider: str,
    request: Request,
    oauth_svc: OAuthService = Depends(get_oauth_service),
    auth_svc: AuthService = Depends(get_auth_service),
):
    try:
        oauth_intent = (
            request.query_params.get("intent")
            or request.cookies.get("oauth_intent")
            or request.session.pop("oauth_intent", "login")
            or "login"
        ).strip().lower()
        oauth_intent = "register" if oauth_intent == "register" else "login"
        profile = await oauth_svc.fetch_user_profile(provider, request)
        logger.info("OAuth callback processed provider=%s email=%s", provider, profile.get("email"))
        response = auth_svc.handle_oauth_login(provider, profile, oauth_intent)
        response.delete_cookie("oauth_intent")
        return response
    except HTTPException as exc:
        logger.exception("OAuth callback failed provider=%s status=%s detail=%s", provider, exc.status_code, exc.detail)
        base = FRONTEND_BASE_URL.rstrip("/")
        error_qs = urlencode({"oauth_error": str(exc.detail)})
        return RedirectResponse(
            url=f"{base}/auth/login?{error_qs}",
            status_code=status.HTTP_302_FOUND,
        )


@router.post("/select-role", response_model=SelectRoleResponse)
async def select_role(
    payload: SelectRoleRequest,
    svc: AuthService = Depends(get_auth_service),
):
    return svc.select_oauth_role(payload.user_id, payload.role)

# ================= CURRENT USER =================
# get_current_user est défini dans core/rbac/dependencies.py

@router.get("/me")
async def get_me(
    user_id: Annotated[int, Depends(get_current_user)],
    svc: AuthService = Depends(get_auth_service),
):
    return svc.get_profile(user_id)


@router.get("/role-protected-example")
async def role_protected_example(user_id: Annotated[int, Depends(get_current_user)], svc: AuthService = Depends(get_auth_service)):
    """Exemple d'endpoint protégé exigeant un rôle utilisateur."""
    profile = svc.get_profile(user_id)
    if profile.get("role") is None:
        return {"message": "Authenticated but role is not selected", "user_id": user_id}
    return {"message": "Role-protected access granted", "user_id": user_id, "role": profile["role"]["code"]}


@router.post("/request-reset-password", response_model=MessageResponse)
async def request_reset_password(
    payload: RequestResetPasswordRequest,
    svc: PasswordResetService = Depends(get_password_reset_service),
):
    return svc.request_reset_password(payload.email)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    payload: ResetPasswordRequest,
    svc: PasswordResetService = Depends(get_password_reset_service),
):
    return svc.reset_password(payload.token, payload.new_password)