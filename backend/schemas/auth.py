"""Pydantic schemas for authentication endpoints."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Request body for user registration."""

    email: str = Field(min_length=5, max_length=255, examples=["teacher@example.com"])
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100, examples=["Alice"])
    role: str = Field(default="teacher", pattern=r"^(teacher|student)$")


class LoginRequest(BaseModel):
    """Request body for user login."""

    email: str = Field(examples=["teacher@example.com"])
    password: str = Field()


class TokenResponse(BaseModel):
    """JWT token returned on successful login/register."""

    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Public user profile returned from /me."""

    id: str
    email: str
    display_name: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}
