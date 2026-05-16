"""认证安全与会话工具。"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.user import AuthSession, AuthUser

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

AUTH_COOKIE_NAME = "caiwu_session"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _is_production_env() -> bool:
    value = (
        os.environ.get("APP_ENV")
        or os.environ.get("ENV")
        or os.environ.get("ENVIRONMENT")
        or ""
    ).strip().lower()
    return value in {"prod", "production"}


def get_auth_jwt_secret() -> str:
    secret = os.environ.get("AUTH_JWT_SECRET", "").strip()
    if not secret:
        raise RuntimeError("AUTH_JWT_SECRET is missing.")
    return secret


def get_auth_session_hours() -> int:
    raw = os.environ.get("AUTH_SESSION_HOURS", "8").strip()
    try:
        value = int(raw)
    except ValueError:
        value = 8
    return max(1, min(168, value))


def get_auth_cookie_domain() -> str | None:
    value = os.environ.get("AUTH_COOKIE_DOMAIN", "").strip()
    return value or None


def get_auth_cookie_secure() -> bool:
    raw = os.environ.get("AUTH_COOKIE_SECURE")
    if raw is not None and raw.strip():
        return raw.strip().lower() in {"1", "true", "yes", "on"}
    return _is_production_env()


def get_auth_cookie_samesite() -> str:
    raw = os.environ.get("AUTH_COOKIE_SAMESITE")
    if raw is not None and raw.strip():
        value = raw.strip().lower()
        if value in {"none", "lax", "strict"}:
            return value
    # 本地开发（HTTP）默认用 lax，避免浏览器拒收 Cookie。
    if not get_auth_cookie_secure():
        return "lax"
    return "none"


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    if not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(*, user_id: str, email: str, role: str, session_id: str, jti: str) -> str:
    now = _utcnow()
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "sid": session_id,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=get_auth_session_hours())).timestamp()),
    }
    return jwt.encode(payload, get_auth_jwt_secret(), algorithm="HS256")


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, get_auth_jwt_secret(), algorithms=["HS256"])
        if not isinstance(payload, dict):
            raise ValueError("invalid payload")
        return payload
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效，请重新登录") from exc


def set_auth_cookie(response, token: str) -> None:
    max_age = get_auth_session_hours() * 3600
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=get_auth_cookie_secure(),
        samesite=get_auth_cookie_samesite(),
        domain=get_auth_cookie_domain(),
        path="/",
    )


def clear_auth_cookie(response) -> None:
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        httponly=True,
        secure=get_auth_cookie_secure(),
        samesite=get_auth_cookie_samesite(),
        domain=get_auth_cookie_domain(),
        path="/",
    )


def create_session(db: Session, user: AuthUser) -> tuple[str, AuthSession]:
    now = _utcnow()
    sid = str(uuid4())
    jti = str(uuid4())
    session = AuthSession(
        id=sid,
        user_id=user.id,
        token_jti=jti,
        issued_at=now,
        expires_at=now + timedelta(hours=get_auth_session_hours()),
    )
    db.add(session)
    db.flush()
    token = create_access_token(user_id=user.id, email=user.email, role=user.role, session_id=sid, jti=jti)
    return token, session


def get_user_by_email(db: Session, email: str) -> AuthUser | None:
    normalized = email.strip().lower()
    return db.execute(select(AuthUser).where(AuthUser.email == normalized)).scalars().first()


def is_locked(user: AuthUser) -> bool:
    return user.locked_until is not None and user.locked_until > _utcnow()


def register_login_fail(user: AuthUser) -> None:
    now = _utcnow()
    user.failed_login_count = int(user.failed_login_count or 0) + 1
    if user.failed_login_count >= 5:
        user.locked_until = now + timedelta(minutes=10)


def clear_login_fail(user: AuthUser) -> None:
    user.failed_login_count = 0
    user.locked_until = None
    user.last_login_at = _utcnow()


def require_current_user(
    db: Session = Depends(get_db),
    token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME),
) -> AuthUser:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="请先登录")
    payload = decode_access_token(token)
    user_id = str(payload.get("sub") or "")
    sid = str(payload.get("sid") or "")
    jti = str(payload.get("jti") or "")
    if not user_id or not sid or not jti:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录凭证无效")

    user = db.execute(select(AuthUser).where(AuthUser.id == user_id)).scalars().first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="账号不可用")

    session = db.execute(select(AuthSession).where(AuthSession.id == sid)).scalars().first()
    now = _utcnow()
    if (
        session is None
        or session.user_id != user_id
        or session.token_jti != jti
        or session.revoked_at is not None
        or session.expires_at <= now
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已失效，请重新登录")
    return user


def require_admin(user: AuthUser = Depends(require_current_user)) -> AuthUser:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要管理员权限")
    return user
