"""验证码邮件发送（Resend）。"""

from __future__ import annotations

import os

import httpx


def _resend_api_key() -> str:
    key = os.environ.get("RESEND_API_KEY", "").strip()
    if not key:
        raise RuntimeError("RESEND_API_KEY is missing.")
    return key


def _resend_from_email() -> str:
    sender = os.environ.get("RESEND_FROM_EMAIL", "").strip()
    if not sender:
        raise RuntimeError("RESEND_FROM_EMAIL is missing.")
    return sender


async def send_otp_email(*, to_email: str, otp_code: str) -> None:
    url = "https://api.resend.com/emails"
    payload = {
        "from": _resend_from_email(),
        "to": [to_email],
        "subject": "财务系统登录验证码",
        "html": (
            "<div style='font-family:Arial,sans-serif;'>"
            "<h3>财务系统登录验证码</h3>"
            f"<p>您的验证码是：<b style='font-size:20px;'>{otp_code}</b></p>"
            "<p>验证码 5 分钟内有效，请勿泄露给他人。</p>"
            "</div>"
        ),
    }
    headers = {"Authorization": f"Bearer {_resend_api_key()}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(url, json=payload, headers=headers)
    if res.status_code >= 300:
        raise RuntimeError(f"send otp email failed: {res.status_code} {res.text[:300]}")
