from datetime import datetime, timedelta
import logging

from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette import status

from core.config import FRONTEND_BASE_URL, FRONTEND_RESET_PASSWORD_PATH
from core.security import hash_password
from models.password_reset_token import PasswordResetToken
from models.user import Utilisateur
from services.email_service import send_reset_email
from utils.token import generate_reset_token

logger = logging.getLogger(__name__)


class PasswordResetService:
    """Service metier pour la reinitialisation de mot de passe via lien email."""

    RESET_TOKEN_EXPIRATION_MINUTES = 15

    def __init__(self, db: Session):
        self.db = db

    def _raise_password_reset_db_unavailable(self) -> None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password reset is temporarily unavailable. Database migration is required.",
        )

    def request_reset_password(self, email: str) -> dict:
        try:
            user = self.db.query(Utilisateur).filter(Utilisateur.email == email).first()

            # Return generic success response to avoid user enumeration.
            if not user:
                return {
                    "message": "If this email exists, a password reset link has been sent"
                }

            token = generate_reset_token()
            expires_at = datetime.utcnow() + timedelta(minutes=self.RESET_TOKEN_EXPIRATION_MINUTES)

            reset_row = PasswordResetToken(
                user_id=user.id,
                token=token,
                expires_at=expires_at,
                used=False,
            )

            self.db.add(reset_row)
            self.db.commit()

            reset_link = f"{FRONTEND_BASE_URL}{FRONTEND_RESET_PASSWORD_PATH}?token={token}"
            send_reset_email(user.email, reset_link)

            return {
                "message": "If this email exists, a password reset link has been sent"
            }
        except RuntimeError as exc:
            message = str(exc)
            logger.error("SMTP/email service error: %s", message)
            status_code = (
                status.HTTP_500_INTERNAL_SERVER_ERROR
                if "not configured" in message.lower()
                else status.HTTP_502_BAD_GATEWAY
            )
            raise HTTPException(
                status_code=status_code,
                detail=message,
            )
        except SQLAlchemyError:
            self.db.rollback()
            self._raise_password_reset_db_unavailable()
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Unexpected error during password reset request")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process password reset request.",
            )

    def reset_password(self, token: str, new_password: str) -> dict:
        try:
            now = datetime.utcnow()
            reset_row = (
                self.db.query(PasswordResetToken)
                .filter(PasswordResetToken.token == token)
                .with_for_update()
                .first()
            )

            if not reset_row:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid reset token",
                )

            if reset_row.used:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Reset token has already been used",
                )

            if reset_row.expires_at < now:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Reset token has expired",
                )

            user = self.db.query(Utilisateur).filter(Utilisateur.id == reset_row.user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found for this reset token",
                )

            user.motDePasse = hash_password(new_password[:72])
            reset_row.used = True
            reset_row.used_at = now

            self.db.commit()

            return {"message": "Password has been reset successfully"}
        except HTTPException:
            raise
        except SQLAlchemyError:
            self.db.rollback()
            self._raise_password_reset_db_unavailable()
