"""认证与账号管理 Schema。"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PasswordLoginRequest(BaseModel):
    account: str | None = Field(default=None, min_length=1, max_length=128)
    email: str | None = Field(default=None, min_length=1, max_length=128)
    password: str = Field(min_length=6, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=6, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class AdminResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=6, max_length=128)


class UserCreateRequest(BaseModel):
    email: str = Field(min_length=1, max_length=128)
    display_name: str | None = None
    role: str = "user"
    password: str | None = Field(default=None, min_length=6, max_length=128)


class UserStatusRequest(BaseModel):
    is_active: bool


class AuthMeResponse(BaseModel):
    id: str
    email: str
    display_name: str | None
    role: str
    is_active: bool
    last_login_at: datetime | None


class AuthUserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    display_name: str | None
    role: str
    is_active: bool
    failed_login_count: int
    locked_until: datetime | None
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AuthUsersListResponse(BaseModel):
    items: list[AuthUserRead]
    total: int


class AuthMessageResponse(BaseModel):
    ok: bool = True
    message: str
