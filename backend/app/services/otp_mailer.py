"""验证码邮件发送（Resend）。"""

from __future__ import annotations

import os
from datetime import datetime

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
    today = datetime.now().strftime("%Y年%m月%d日")
    login_url = "https://caiwu2026.hnchpower.cn/"
    logo_url = "http://static.10tap.top/web/img/logo.png?v=10"
    html = f"""
<div style="margin:0;padding:0;background-color:#000000;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:40px 0;background:#000000;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:560px;max-width:560px;background:#0a0a0a;border:1px solid #1f1f1f;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 18px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <div style="margin-bottom:14px;">
                <img src="{logo_url}" alt="财务系统 Logo" width="132" style="display:block;height:auto;border:0;outline:none;text-decoration:none;" />
              </div>
              <div style="font-size:14px;line-height:20px;color:#8a8a8a;letter-spacing:0.2px;">财务系统</div>
              <div style="margin-top:10px;font-size:34px;line-height:42px;font-weight:700;color:#ffffff;letter-spacing:-0.6px;">登录验证码</div>
              <div style="margin-top:14px;font-size:15px;line-height:28px;color:#b5b5b5;">
                今天是 {today}。您正在进行财务系统登录验证，请使用以下验证码完成登录。
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 0 32px;"><div style="height:1px;background:#1f1f1f;"></div></td>
          </tr>
          <tr>
            <td style="padding:28px 32px 10px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <div style="padding:30px 20px;border-radius:18px;background:#111111;border:1px solid #202020;text-align:center;">
                <div style="font-size:12px;line-height:18px;color:#7c7c7c;letter-spacing:1.5px;">VERIFICATION CODE</div>
                <div style="margin-top:14px;font-size:44px;line-height:52px;font-weight:700;color:#ffffff;letter-spacing:12px;">{otp_code}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 8px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #1a1a1a;">
                    <span style="font-size:13px;color:#7c7c7c;">登录地址</span>
                    <span style="float:right;font-size:13px;color:#f3f3f3;">
                      <a href="{login_url}" target="_blank" style="color:#f3f3f3;text-decoration:none;">caiwu2026.hnchpower.cn</a>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #1a1a1a;">
                    <span style="font-size:13px;color:#7c7c7c;">有效时间</span>
                    <span style="float:right;font-size:13px;color:#f3f3f3;">5 分钟</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 30px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <div style="font-size:13px;line-height:24px;color:#8a8a8a;">请勿向任何人泄露验证码。如非本人操作，请忽略此邮件。</div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 24px 32px;border-top:1px solid #161616;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <div style="font-size:12px;line-height:20px;color:#5f5f5f;">此邮件由系统自动发送，请勿回复。<br />© 2026 财务系统</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>
"""
    payload = {
        "from": _resend_from_email(),
        "to": [to_email],
        "subject": "财务系统登录验证码",
        "html": html,
    }
    headers = {"Authorization": f"Bearer {_resend_api_key()}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(url, json=payload, headers=headers)
    if res.status_code >= 300:
        raise RuntimeError(f"send otp email failed: {res.status_code} {res.text[:300]}")
