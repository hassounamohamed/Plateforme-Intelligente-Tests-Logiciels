"""
Service for managing user custom API keys for AI services.

Handles:
- Saving/updating encrypted API keys
- Toggling between custom and platform API keys
- Deleting API keys
- Tracking API key usage
- Managing quota and usage limits
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session
from starlette import status

from models.user import Utilisateur
from repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)


class APIKeyService:
    """Service for managing user API keys."""

    # Free quota limit per month (in request equivalents)
    # Adjust based on platform capacity
    FREE_QUOTA_LIMIT = 10000

    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    # =========================================================
    # SAVE / UPDATE API KEY
    # =========================================================

    def save_api_key(self, user_id: int, api_key: str, provider: str = "openrouter") -> dict:
        """
        Save or update user's custom API key (encrypted).
        
        Args:
            user_id: ID of the user
            api_key: The raw API key to be encrypted
            provider: API provider (e.g., 'openrouter')
            
        Returns:
            APIKeyStatusResponse data
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        try:
            # The api_key field uses EncryptedString, so it's automatically encrypted
            user.custom_api_key = api_key
            user.api_key_created_at = datetime.utcnow()
            # Don't auto-enable it; user must explicitly toggle
            # user.use_custom_api_key = True
            
            self.db.commit()
            self.db.refresh(user)
            
            logger.info(f"API key saved for user {user_id} (provider: {provider})")
            
            return self._build_status_response(user)
        except Exception as exc:
            self.db.rollback()
            logger.exception(f"Failed to save API key for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save API key"
            ) from exc

    # =========================================================
    # GET API KEY STATUS
    # =========================================================

    def get_api_key_status(self, user_id: int) -> dict:
        """
        Get current API key status for the user.
        
        Returns:
            APIKeyStatusResponse data with masked key
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return self._build_status_response(user)

    # =========================================================
    # TOGGLE API KEY USAGE
    # =========================================================

    def toggle_api_key(self, user_id: int, use_custom: bool) -> dict:
        """
        Toggle whether to use custom API key or platform key.
        
        Args:
            user_id: ID of the user
            use_custom: True to use custom key, False to use platform key
            
        Returns:
            APIKeyStatusResponse data
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Validate: can only enable custom key if one exists
        if use_custom and not user.custom_api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Custom API key not configured. Save one first."
            )

        try:
            user.use_custom_api_key = use_custom
            self.db.commit()
            self.db.refresh(user)
            
            key_type = "custom" if use_custom else "platform"
            logger.info(f"User {user_id} switched to {key_type} API key")
            
            return self._build_status_response(user)
        except Exception as exc:
            self.db.rollback()
            logger.exception(f"Failed to toggle API key for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to toggle API key"
            ) from exc

    # =========================================================
    # DELETE API KEY
    # =========================================================

    def delete_api_key(self, user_id: int) -> dict:
        """
        Delete user's custom API key and switch to platform key.
        
        Args:
            user_id: ID of the user
            
        Returns:
            APIKeyDeleteResponse data
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        try:
            user.custom_api_key = None
            user.use_custom_api_key = False  # Revert to platform key
            user.api_key_created_at = None
            user.api_key_last_used = None
            
            self.db.commit()
            self.db.refresh(user)
            
            logger.info(f"API key deleted for user {user_id}")
            
            return {
                "message": "API key deleted successfully. Using platform key.",
                "use_custom_api_key": False
            }
        except Exception as exc:
            self.db.rollback()
            logger.exception(f"Failed to delete API key for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete API key"
            ) from exc

    # =========================================================
    # QUOTA & USAGE TRACKING
    # =========================================================

    def get_api_key_quota(self, user_id: int) -> dict:
        """
        Get user's API usage quota and remaining quota.
        
        Returns:
            APIKeyQuotaResponse data
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # TODO: Implement actual usage tracking from log_systems or dedicated usage table
        # For now, return mock data
        quota_used = 0  # This should be fetched from logs/usage tracking
        quota_limit = self.FREE_QUOTA_LIMIT
        quota_remaining = max(0, quota_limit - quota_used)
        quota_percentage = (quota_used / quota_limit * 100) if quota_limit > 0 else 0
        quota_exhausted = quota_used >= quota_limit

        # Calculate next reset date (first day of next month)
        now = datetime.utcnow()
        if now.month == 12:
            next_reset = now.replace(year=now.year + 1, month=1, day=1)
        else:
            next_reset = now.replace(month=now.month + 1, day=1)

        return {
            "quota_limit_free": quota_limit,
            "quota_used": quota_used,
            "quota_remaining": quota_remaining,
            "quota_percentage": round(quota_percentage, 2),
            "quota_exhausted": quota_exhausted,
            "has_custom_key": bool(user.custom_api_key),
            "next_reset_date": next_reset.isoformat() + "Z"
        }

    def update_api_key_last_used(self, user_id: int) -> None:
        """
        Update the timestamp when custom API key was last used.
        Called after a successful API request using the custom key.
        
        Args:
            user_id: ID of the user
        """
        try:
            user = self.user_repo.get_by_id(user_id)
            if user and user.use_custom_api_key:
                user.api_key_last_used = datetime.utcnow()
                self.db.commit()
        except Exception as exc:
            logger.exception(f"Failed to update api_key_last_used for user {user_id}")

    def get_api_key_for_user(self, user_id: int) -> Optional[str]:
        """
        Get the appropriate API key for a user.
        
        Returns the user's custom key if enabled, None otherwise.
        The caller should fall back to platform key if None.
        
        Args:
            user_id: ID of the user
            
        Returns:
            User's custom API key if enabled, None if using platform key
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return None

        if user.use_custom_api_key and user.custom_api_key:
            return user.custom_api_key
        
        return None

    # =========================================================
    # HELPERS
    # =========================================================

    def _build_status_response(self, user: Utilisateur) -> dict:
        """Build APIKeyStatusResponse from user object."""
        masked_key = None
        if user.custom_api_key:
            # Mask all but last 4 characters
            if len(user.custom_api_key) >= 4:
                masked_key = "*" * (len(user.custom_api_key) - 4) + user.custom_api_key[-4:]
            else:
                masked_key = "*" * len(user.custom_api_key)

        return {
            "has_custom_key": bool(user.custom_api_key),
            "use_custom_api_key": bool(user.use_custom_api_key),
            "provider": "openrouter",
            "masked_key": masked_key,
            "api_key_created_at": user.api_key_created_at.isoformat() + "Z" if user.api_key_created_at else None,
            "api_key_last_used": user.api_key_last_used.isoformat() + "Z" if user.api_key_last_used else None,
        }
