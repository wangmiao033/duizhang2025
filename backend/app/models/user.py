"""认证用户 ORM 模型。"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base


class AuthUser(Base):
    __tablename__ = "auth_users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, nullable=False, default="user")
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    failed_login_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    otp_codes: Mapped[list["AuthOtpCode"]] = relationship(
        "AuthOtpCode",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    sessions: Mapped[list["AuthSession"]] = relationship(
        "AuthSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class AuthOtpCode(Base):
    __tablename__ = "auth_otp_codes"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    code_hash: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    request_ip: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["AuthUser"] = relationship("AuthUser", back_populates="otp_codes")


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_jti: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["AuthUser"] = relationship("AuthUser", back_populates="sessions")
