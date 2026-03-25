from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
import logging
from urllib.parse import urlencode

import httpx
from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from starlette import status

from core.security import create_access_token
from core.config import (
    ENVIRONMENT,
    FRONTEND_BASE_URL,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_REDIRECT_URI,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
)
from models.user import Role, Utilisateur

SUPPORTED_PROVIDERS = {"google", "github"}
Provider = Literal["google", "github"]
logger = logging.getLogger(__name__)


def _build_oauth_registry() -> OAuth:
    oauth = OAuth()

    oauth.register(
        name="google",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

    oauth.register(
        name="github",
        client_id=GITHUB_CLIENT_ID,
        client_secret=GITHUB_CLIENT_SECRET,
        access_token_url="https://github.com/login/oauth/access_token",
        authorize_url="https://github.com/login/oauth/authorize",
        api_base_url="https://api.github.com/",
        client_kwargs={"scope": "read:user user:email"},
    )

    return oauth


oauth_registry = _build_oauth_registry()


class OAuthService:
    def __init__(self, db: Session):
        self.db = db

    def _validate_provider(self, provider: str) -> Provider:
        if provider not in SUPPORTED_PROVIDERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provider '{provider}' not supported",
            )
        return provider  # type: ignore[return-value]

    def _provider_redirect_uri(self, provider: Provider, request: Request) -> str:
        if provider == "google" and GOOGLE_REDIRECT_URI:
            return GOOGLE_REDIRECT_URI
        if provider == "github" and GITHUB_REDIRECT_URI:
            return GITHUB_REDIRECT_URI
        return str(request.url_for("oauth_callback", provider=provider))

    def _assert_provider_config(self, provider: Provider) -> None:
        if provider == "google" and (not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth is not configured",
            )
        if provider == "github" and (not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GitHub OAuth is not configured",
            )

    async def authorize_redirect(self, provider: str, request: Request, intent: str = "login"):
        valid_provider = self._validate_provider(provider)
        self._assert_provider_config(valid_provider)

        # Clear stale oauth state keys from previous interrupted attempts.
        stale_state_keys = [k for k in request.session.keys() if "_state_" in k]
        for key in stale_state_keys:
            request.session.pop(key, None)

        # Ensure intent is persisted in session (mark as changed to force save)
        request.session["oauth_intent"] = intent
        request.session["oauth_host"] = request.url.hostname
        # Touch the session to ensure it's marked as modified for Starlette SessionMiddleware
        _ = request.session.get("oauth_intent")

        logger.info(
            "OAuth authorize redirect provider=%s host=%s intent=%s stale_state_keys_cleared=%s",
            valid_provider,
            request.url.hostname,
            intent,
            len(stale_state_keys),
        )

        client = oauth_registry.create_client(valid_provider)
        if client is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"OAuth client '{valid_provider}' is unavailable",
            )

        redirect_uri = self._provider_redirect_uri(valid_provider, request)
        logger.info("OAuth authorize redirect_uri provider=%s uri=%s", valid_provider, redirect_uri)

        return await client.authorize_redirect(request, redirect_uri)

    async def _fetch_google_profile(self, request: Request) -> dict[str, Any]:
        code = request.query_params.get("code")

        # Prefer Authlib standard flow first. In local dev, if state/session is
        # unstable, fallback to manual exchange only when code is present.
        try:
            token = await oauth_registry.google.authorize_access_token(request)
        except OAuthError as exc:
            can_fallback_manually = (
                ENVIRONMENT == "development"
                and bool(code)
                and getattr(exc, "error", "") in {"mismatching_state", "invalid_state"}
            )
            if not can_fallback_manually:
                raise

            logger.warning(
                "OAuth google state issue in development, fallback to manual token exchange"
            )
            token = await self._exchange_google_code_manually(code, request)

        user_info = token.get("userinfo")
        if not user_info:
            user_info = await self._fetch_google_userinfo(token)

        if not user_info or not user_info.get("email"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account did not return an email",
            )

        return {
            "email": user_info["email"],
            "name": user_info.get("name") or user_info.get("given_name"),
            "picture": user_info.get("picture"),
            "provider": "google",
        }

    async def _exchange_google_code_manually(self, code: str, request: Request) -> dict[str, Any]:
        redirect_uri = self._provider_redirect_uri("google", request)
        payload = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post("https://oauth2.googleapis.com/token", data=payload)
            try:
                token_resp.raise_for_status()
            except httpx.HTTPStatusError:
                detail = "Google OAuth token exchange failed"
                try:
                    error_payload = token_resp.json()
                    err = error_payload.get("error")
                    err_desc = error_payload.get("error_description")
                    if err and err_desc:
                        detail = f"Google OAuth error: {err} ({err_desc})"
                    elif err:
                        detail = f"Google OAuth error: {err}"
                except Exception:
                    pass
                logger.exception("%s", detail)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=detail,
                )
            return token_resp.json()

    async def _fetch_google_userinfo(self, token: dict[str, Any]) -> dict[str, Any]:
        access_token = token.get("access_token")
        if not access_token:
            return {}
        async with httpx.AsyncClient(timeout=15.0) as client:
            userinfo_resp = await client.get(
                "https://openidconnect.googleapis.com/v1/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            userinfo_resp.raise_for_status()
            return userinfo_resp.json()

    async def _exchange_github_code_manually(self, code: str, request: Request) -> dict[str, Any]:
        """Manual GitHub token exchange fallback for state mismatch in development."""
        redirect_uri = self._provider_redirect_uri("github", request)
        payload = {
            "code": code,
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                data=payload,
                headers={"Accept": "application/json"},
            )
            try:
                token_resp.raise_for_status()
            except httpx.HTTPStatusError:
                detail = "GitHub OAuth token exchange failed"
                try:
                    error_payload = token_resp.json()
                    err = error_payload.get("error")
                    err_desc = error_payload.get("error_description")
                    if err and err_desc:
                        detail = f"GitHub OAuth error: {err} ({err_desc})"
                    elif err:
                        detail = f"GitHub OAuth error: {err}"
                except Exception:
                    pass
                logger.exception("%s", detail)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=detail,
                )
            return token_resp.json()

    async def _fetch_github_emails(self, token: dict[str, Any]) -> list[dict[str, Any]]:
        """Fetch GitHub emails using Authlib first, then direct HTTP fallback."""
        emails_payload: Any = None

        try:
            emails_response = await oauth_registry.github.get("user/emails", token=token)
            emails_payload = emails_response.json()
            if isinstance(emails_payload, list):
                return [item for item in emails_payload if isinstance(item, dict)]
            logger.warning(
                "GitHub user/emails unexpected payload via Authlib type=%s payload=%s",
                type(emails_payload).__name__,
                emails_payload,
            )
        except Exception as exc:
            logger.warning("GitHub user/emails Authlib fetch failed: %s", str(exc))

        access_token = token.get("access_token")
        if not access_token:
            logger.warning("GitHub token missing access_token for direct email fetch")
            return []

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    "https://api.github.com/user/emails",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/vnd.github+json",
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                )
                payload = resp.json()
                if resp.status_code >= 400:
                    logger.warning(
                        "GitHub user/emails direct fetch failed status=%s payload=%s",
                        resp.status_code,
                        payload,
                    )
                    return []
                if isinstance(payload, list):
                    return [item for item in payload if isinstance(item, dict)]
                logger.warning(
                    "GitHub user/emails direct fetch unexpected payload type=%s payload=%s",
                    type(payload).__name__,
                    payload,
                )
                return []
        except Exception as exc:
            logger.warning("GitHub user/emails direct fetch exception: %s", str(exc))
            return []

    async def _fetch_github_profile(self, request: Request) -> dict[str, Any]:
        code = request.query_params.get("code")
        
        # Try Authlib standard flow first
        try:
            token = await oauth_registry.github.authorize_access_token(request)
        except OAuthError as exc:
            # Allow fallback in development only when code is present and state error occurs
            can_fallback_manually = (
                ENVIRONMENT == "development"
                and bool(code)
                and getattr(exc, "error", "") in {"mismatching_state", "invalid_state"}
            )
            if not can_fallback_manually:
                raise

            logger.warning(
                "OAuth github state issue in development, fallback to manual token exchange"
            )
            token = await self._exchange_github_code_manually(code, request)

        profile_response = await oauth_registry.github.get("user", token=token)
        profile = profile_response.json()

        email = profile.get("email")
        github_id = profile.get("id")
        github_login = profile.get("login")
        if not email:
            emails = await self._fetch_github_emails(token)
            primary_verified = next(
                (
                    item.get("email")
                    for item in emails
                    if item.get("primary") and item.get("verified") and item.get("email")
                ),
                None,
            )
            fallback_verified = next(
                (item.get("email") for item in emails if item.get("verified") and item.get("email")),
                None,
            )

            # In development, allow primary email even if not verified to unblock local tests.
            primary_unverified = next(
                (
                    item.get("email")
                    for item in emails
                    if item.get("primary") and item.get("email")
                ),
                None,
            )
            fallback_any = next((item.get("email") for item in emails if item.get("email")), None)

            if ENVIRONMENT == "development":
                email = primary_verified or fallback_verified or primary_unverified or fallback_any
            else:
                email = primary_verified or fallback_verified

        # Final fallback: when GitHub blocks /user/emails (403), build a stable
        # noreply identity from GitHub account id+login so register/login still works.
        if not email and github_id and github_login:
            email = f"{github_id}+{github_login}@users.noreply.github.com"
            logger.warning(
                "GitHub email unavailable, using deterministic noreply fallback email=%s",
                email,
            )

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub account does not expose an email. Verify your GitHub email and re-authorize the app.",
            )

        return {
            "email": email,
            "name": profile.get("name") or profile.get("login"),
            "picture": profile.get("avatar_url"),
            "provider": "github",
        }

    async def fetch_user_profile(self, provider: str, request: Request) -> dict[str, Any]:
        valid_provider = self._validate_provider(provider)
        self._assert_provider_config(valid_provider)
        callback_state = request.query_params.get("state")

        logger.warning(
            "OAuth callback received provider=%s host=%s callback_state=%s environment=%s session_keys=%s",
            valid_provider,
            request.url.hostname,
            callback_state[:8] if callback_state else None,
            ENVIRONMENT,
            list(request.session.keys()),
        )

        try:
            if valid_provider == "google":
                profile = await self._fetch_google_profile(request)
            else:
                profile = await self._fetch_github_profile(request)
            logger.info("OAuth profile fetched provider=%s email=%s", valid_provider, profile.get("email"))
            return profile
        except OAuthError as exc:
            logger.exception(
                "OAuth error provider=%s error=%s description=%s (check state/session and redirect URI host consistency)",
                valid_provider,
                getattr(exc, "error", None),
                getattr(exc, "description", None),
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"OAuth authentication failed: {exc.error}",
            ) from exc

    def _build_login_response(self, user: Utilisateur) -> dict[str, Any]:
        access_token = create_access_token({"sub": str(user.id)})
        if not user.role:
            return {
                "need_role": True,
                "user_id": user.id,
                "access_token": access_token, 
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "nom": user.nom,
                    "provider": user.provider,
                    "role": None,
                    },
            }

        access_token = create_access_token({"sub": str(user.id), "role": user.role.code})
        return {
            "need_role": False,
            "user_id": user.id,
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "nom": user.nom,
                "provider": user.provider,
                "role": user.role.code,
            },
        }

    def _frontend_callback_url(self, data: dict[str, Any]) -> str:
        params: dict[str, str] = {}
        base = FRONTEND_BASE_URL.rstrip("/")

        if data.get("need_role"):
            params["user_id"] = str(data["user_id"])
            return f"{base}/select-role?{urlencode(params)}"
        else:
            params["need_role"] = "false"
            params["access_token"] = data["access_token"]
            params["token_type"] = data.get("token_type", "bearer")
            params["user_id"] = str(data["user"]["id"])
            params["email"] = data["user"]["email"]
            params["nom"] = data["user"].get("nom") or ""
            params["role"] = data["user"].get("role") or ""
        return f"{base}/auth/oauth/callback?{urlencode(params)}"

    async def handle_callback(self, provider: str, request: Request) -> RedirectResponse:
        logger.warning("OAuthService.handle_callback is deprecated; callback should use AuthService.handle_oauth_login")
        valid_provider = self._validate_provider(provider)
        self._assert_provider_config(valid_provider)

        try:
            if valid_provider == "google":
                profile = await self._fetch_google_profile(request)
            else:
                profile = await self._fetch_github_profile(request)
        except OAuthError as exc:
            base = FRONTEND_BASE_URL.rstrip("/")
            error_url = f"{base}/auth/login?oauth_error={urlencode({'message': exc.error}).split('=', 1)[1]}"
            return RedirectResponse(url=error_url, status_code=status.HTTP_302_FOUND)

        user = self.db.query(Utilisateur).filter(Utilisateur.email == profile["email"]).first()

        if not user:
            user = Utilisateur(
                nom=profile.get("nom") or profile["email"].split("@")[0],
                email=profile["email"],
                motDePasse=None,
                provider=valid_provider,
                role_id=None,
                actif=True,
                dateCreation=datetime.utcnow(),
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        else:
            if user.provider and user.provider != valid_provider:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"This account is already linked to provider '{user.provider}'",
                )

            if not user.provider:
                user.provider = valid_provider

            user.derniereConnexion = datetime.utcnow()
            self.db.commit()
            self.db.refresh(user)

        response_data = self._build_login_response(user)
        return RedirectResponse(
            url=self._frontend_callback_url(response_data),
            status_code=status.HTTP_302_FOUND,
        )

    def select_role(self, user_id: int, role_code: str) -> dict[str, Any]:
        user = self.db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if user.role_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Role has already been selected and cannot be changed",
            )

        normalized_code = role_code.strip().upper()
        role = self.db.query(Role).filter(Role.code == normalized_code).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role '{role_code}' does not exist",
            )

        user.role_id = role.id
        self.db.commit()
        self.db.refresh(user)

        access_token = create_access_token({"sub": str(user.id), "role": role.code})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "nom": user.nom,
                "provider": user.provider,
                "role": role.code,
            },
        }
