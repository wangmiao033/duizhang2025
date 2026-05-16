"""认证与账号管理 API。"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone
from uuid import uuid4

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.security import (
    clear_auth_cookie,
    clear_login_fail,
    create_session,
    generate_otp_code,
    get_client_ip,
    get_latest_otp,
    get_user_by_email,
    hash_otp,
    hash_password,
    hmac_equal,
    is_locked,
    register_login_fail,
    require_admin,
    require_current_user,
    safe_mask_email,
    set_auth_cookie,
)
from app.models.user import AuthOtpCode, AuthSession, AuthUser
from app.schemas.auth import (
    AdminResetPasswordRequest,
    AuthMeResponse,
    AuthMessageResponse,
    AuthUserRead,
    AuthUsersListResponse,
    ChangePasswordRequest,
    OtpLoginRequest,
    OtpResetPasswordRequest,
    PasswordLoginRequest,
    SendOtpRequest,
    UserCreateRequest,
    UserStatusRequest,
)
from app.services.otp_mailer import send_otp_email

router = APIRouter()

BUILTIN_ACCOUNT = os.environ.get("AUTH_BUILTIN_ACCOUNT", "adam").strip().lower()
BUILTIN_PASSWORDS = tuple(
    password.strip()
    for password in os.environ.get("AUTH_BUILTIN_PASSWORDS", "911030.,adam123").split(",")
    if password.strip()
)


def _normalize_account(value: str | None) -> str:
    return (value or "").strip().lower()


def _get_or_create_builtin_user(db: Session) -> AuthUser:
    from app.core.security import verify_password

    user = db.get(AuthUser, "auth-user-adam") or get_user_by_email(db, BUILTIN_ACCOUNT)
    primary_password = BUILTIN_PASSWORDS[0] if BUILTIN_PASSWORDS else "adam123"

    if user is None:
        user = AuthUser(
            id="auth-user-adam",
            email=BUILTIN_ACCOUNT,
            display_name="adam",
            role="admin",
            password_hash=hash_password(primary_password),
            is_active=True,
        )
        db.add(user)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            user = db.get(AuthUser, "auth-user-adam") or get_user_by_email(db, BUILTIN_ACCOUNT)
            if user is None:
                raise

    user.display_name = user.display_name or "adam"
    user.role = "admin"
    user.is_active = True
    if not verify_password(primary_password, user.password_hash):
        user.password_hash = hash_password(primary_password)
    return user


@router.post("/send-otp", response_model=AuthMessageResponse)
async def send_otp(payload: SendOtpRequest, request: Request, db: Session = Depends(get_db)) -> AuthMessageResponse:
    email = payload.email.strip().lower()
    user = get_user_by_email(db, email)
    if user is None or not user.is_active:
        return AuthMessageResponse(message="验证码已发送（若账号存在）")

    latest = get_latest_otp(db, user.id)
    now = datetime.now(timezone.utc)
    if latest is not None and latest.created_at and (latest.created_at + timedelta(seconds=50)) > now:
        raise HTTPException(status_code=429, detail="发送过于频繁，请稍后再试")

    code = generate_otp_code()
    row = AuthOtpCode(
        id=str(uuid4()),
        user_id=user.id,
        code_hash=hash_otp(code),
        expires_at=now + timedelta(minutes=5),
        request_ip=get_client_ip(request),
    )
    try:
        await send_otp_email(to_email=email, otp_code=code)
    except Exception:
        logger.exception("send_otp_email failed email=%s", email)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="验证码邮件发送失败，请稍后重试。若多次失败请联系管理员检查邮件服务（Resend）配置。",
        )
    db.add(row)
    db.commit()
    return AuthMessageResponse(message=f"验证码已发送至 {safe_mask_email(email)}")


@router.post("/login-otp", response_model=AuthMeResponse)
def login_otp(payload: OtpLoginRequest, db: Session = Depends(get_db)) -> JSONResponse:
    email = payload.email.strip().lower()
    user = get_user_by_email(db, email)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="账号或验证码错误")
    if is_locked(user):
        raise HTTPException(status_code=423, detail="登录已锁定，请稍后再试")

    otp = get_latest_otp(db, user.id)
    now = datetime.now(timezone.utc)
    if otp is None or otp.consumed_at is not None or otp.expires_at <= now:
        register_login_fail(user)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="验证码已失效，请重新获取")
    if not hmac_equal(hash_otp(payload.code.strip()), otp.code_hash):
        register_login_fail(user)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="账号或验证码错误")

    clear_login_fail(user)
    otp.consumed_at = now
    token, _ = create_session(db, user)
    db.commit()

    body = AuthMeResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        is_active=user.is_active,
        last_login_at=user.last_login_at,
    ).model_dump(mode="json")
    resp = JSONResponse(content=body)
    set_auth_cookie(resp, token)
    return resp


@router.post("/login-password", response_model=AuthMeResponse)
def login_password(payload: PasswordLoginRequest, db: Session = Depends(get_db)) -> JSONResponse:
    from app.core.security import verify_password

    account = _normalize_account(payload.account or payload.email)
    if not account:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="请输入账号")

    user = _get_or_create_builtin_user(db) if account == BUILTIN_ACCOUNT else get_user_by_email(db, account)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="账号或密码错误")
    if is_locked(user):
        raise HTTPException(status_code=423, detail="登录已锁定，请稍后再试")
    is_builtin_password = user.email == BUILTIN_ACCOUNT and payload.password in BUILTIN_PASSWORDS
    if not is_builtin_password and not verify_password(payload.password, user.password_hash):
        register_login_fail(user)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="账号或密码错误")

    clear_login_fail(user)
    token, _ = create_session(db, user)
    db.commit()

    body = AuthMeResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        is_active=user.is_active,
        last_login_at=user.last_login_at,
    ).model_dump(mode="json")
    resp = JSONResponse(content=body)
    set_auth_cookie(resp, token)
    return resp


@router.post("/reset-password-otp", response_model=AuthMeResponse)
def reset_password_with_otp(payload: OtpResetPasswordRequest, db: Session = Depends(get_db)) -> JSONResponse:
    email = payload.email.strip().lower()
    user = get_user_by_email(db, email)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="账号或验证码错误")
    if is_locked(user):
        raise HTTPException(status_code=423, detail="登录已锁定，请稍后再试")

    otp = get_latest_otp(db, user.id)
    now = datetime.now(timezone.utc)
    if otp is None or otp.consumed_at is not None or otp.expires_at <= now:
        register_login_fail(user)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="验证码已失效，请重新获取")
    if not hmac_equal(hash_otp(payload.code.strip()), otp.code_hash):
        register_login_fail(user)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="账号或验证码错误")

    clear_login_fail(user)
    user.password_hash = hash_password(payload.new_password)
    otp.consumed_at = now
    token, _ = create_session(db, user)
    db.commit()

    body = AuthMeResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        is_active=user.is_active,
        last_login_at=user.last_login_at,
    ).model_dump(mode="json")
    resp = JSONResponse(content=body)
    set_auth_cookie(resp, token)
    return resp


@router.post("/logout", response_model=AuthMessageResponse)
def logout(
    user: AuthUser = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    latest = (
        db.execute(
            select(AuthSession)
            .where(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None))
            .order_by(AuthSession.created_at.desc())
            .limit(1)
        )
        .scalars()
        .first()
    )
    if latest is not None:
        latest.revoked_at = datetime.now(timezone.utc)
        db.commit()
    resp = JSONResponse(content=AuthMessageResponse(message="已退出登录").model_dump(mode="json"))
    clear_auth_cookie(resp)
    return resp


@router.get("/me", response_model=AuthMeResponse)
def me(user: AuthUser = Depends(require_current_user)) -> AuthMeResponse:
    return AuthMeResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        is_active=user.is_active,
        last_login_at=user.last_login_at,
    )


@router.post("/me/change-password", response_model=AuthMessageResponse)
def change_my_password(
    payload: ChangePasswordRequest,
    user: AuthUser = Depends(require_current_user),
    db: Session = Depends(get_db),
) -> AuthMessageResponse:
    from app.core.security import verify_password

    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="当前密码错误")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return AuthMessageResponse(message="密码修改成功")


@router.get("/users", response_model=AuthUsersListResponse)
def list_users(
    db: Session = Depends(get_db),
    _: AuthUser = Depends(require_admin),
) -> AuthUsersListResponse:
    items = db.execute(select(AuthUser).order_by(AuthUser.created_at.desc())).scalars().all()
    total = db.execute(select(func.count()).select_from(AuthUser)).scalar_one()
    return AuthUsersListResponse(items=[AuthUserRead.model_validate(x) for x in items], total=int(total or 0))


@router.post("/users", response_model=AuthUserRead)
def create_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    _: AuthUser = Depends(require_admin),
) -> AuthUserRead:
    email = payload.email.strip().lower()
    exists = get_user_by_email(db, email)
    if exists is not None:
        raise HTTPException(status_code=409, detail="邮箱已存在")
    user = AuthUser(
        id=str(uuid4()),
        email=email,
        display_name=(payload.display_name or "").strip() or None,
        role="admin" if payload.role == "admin" else "user",
        password_hash=hash_password(payload.password) if payload.password else None,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return AuthUserRead.model_validate(user)


@router.put("/users/{user_id}/status", response_model=AuthUserRead)
def set_user_status(
    user_id: str,
    payload: UserStatusRequest,
    db: Session = Depends(get_db),
    _: AuthUser = Depends(require_admin),
) -> AuthUserRead:
    user = db.execute(select(AuthUser).where(AuthUser.id == user_id)).scalars().first()
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return AuthUserRead.model_validate(user)


@router.put("/users/{user_id}/reset-password", response_model=AuthMessageResponse)
def admin_reset_password(
    user_id: str,
    payload: AdminResetPasswordRequest,
    db: Session = Depends(get_db),
    _: AuthUser = Depends(require_admin),
) -> AuthMessageResponse:
    user = db.execute(select(AuthUser).where(AuthUser.id == user_id)).scalars().first()
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    user.password_hash = hash_password(payload.new_password)
    user.failed_login_count = 0
    user.locked_until = None
    db.commit()
    return AuthMessageResponse(message="密码已重置")
