from pydantic import BaseModel, EmailStr, Field


class RequestResetPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=20, description="Password reset token")
    new_password: str = Field(..., min_length=8, alias="password", description="New password")

    class Config:
        validate_by_name = True


class MessageResponse(BaseModel):
    message: str