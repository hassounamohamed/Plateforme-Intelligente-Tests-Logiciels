from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from starlette import status

from db.database import get_db
from schemas.user import CreateUserRequest
from schemas.auth import Token
from services.auth_service import AuthService
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


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_password_reset_service(db: Session = Depends(get_db)) -> PasswordResetService:
    return PasswordResetService(db)

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

# ================= CURRENT USER =================
# get_current_user est défini dans core/rbac/dependencies.py

@router.get("/me")
async def get_me(
    user_id: Annotated[int, Depends(get_current_user)],
    svc: AuthService = Depends(get_auth_service),
):
    return svc.get_profile(user_id)


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