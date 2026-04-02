"""
Schemas for API Key management
"""
from typing import Optional
from pydantic import BaseModel, Field, validator


class APIKeyCreateRequest(BaseModel):
    """Request to create/update user's custom API key"""
    api_key: str = Field(..., min_length=10, description="Custom API key (minimum 10 characters)")
    provider: str = Field(default="openrouter", description="API provider (e.g., 'openrouter')")
    
    @validator('api_key')
    def validate_api_key(cls, v):
        """Ensure API key doesn't contain suspicious characters"""
        if any(char in v for char in ['\n', '\r', '\0']):
            raise ValueError("API key contains invalid characters")
        return v.strip()


class APIKeyStatusResponse(BaseModel):
    """Response showing API key status"""
    has_custom_key: bool = Field(description="Whether user has a custom API key")
    use_custom_api_key: bool = Field(description="Whether user is using their custom key")
    provider: str = Field(description="API provider")
    masked_key: Optional[str] = Field(description="Masked API key (last 4 chars only), e.g., '****efgh'")
    api_key_created_at: Optional[str] = Field(description="ISO timestamp when API key was added")
    api_key_last_used: Optional[str] = Field(description="ISO timestamp when custom API key was last used")
    
    class Config:
        from_attributes = True


class APIKeyToggleRequest(BaseModel):
    """Request to toggle between platform and custom API key"""
    use_custom_api_key: bool = Field(description="Whether to use custom API key")


class APIKeyDeleteResponse(BaseModel):
    """Response after deleting API key"""
    message: str = Field(description="Confirmation message")
    use_custom_api_key: bool = Field(description="Now using platform key")


class APIKeyQuotaResponse(BaseModel):
    """Response showing user's API quota status"""
    quota_limit_free: int = Field(default=10000, description="Free quota limit per month (in token equivalents)")
    quota_used: int = Field(description="Number of tokens/requests used this month")
    quota_remaining: int = Field(description="Remaining quota")
    quota_percentage: float = Field(description="Percentage of quota used (0-100)")
    quota_exhausted: bool = Field(description="Whether free quota is exhausted")
    has_custom_key: bool = Field(description="Whether user has added custom API key")
    next_reset_date: Optional[str] = Field(description="ISO timestamp when quota resets")
