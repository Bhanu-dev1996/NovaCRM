"""Transactional email delivery for NovaCRM auth flows."""

from __future__ import annotations

import smtplib
from email.message import EmailMessage

import httpx
from fastapi import HTTPException, status

from app.config import (
    EMAIL_FROM,
    FRONTEND_URL,
    RESEND_API_KEY,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USER,
)


def email_delivery_configured() -> bool:
    if RESEND_API_KEY:
        return True
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def _from_address() -> str:
    if EMAIL_FROM:
        return EMAIL_FROM
    if RESEND_API_KEY:
        return "NovaCRM <onboarding@resend.dev>"
    if SMTP_USER:
        return f"NovaCRM <{SMTP_USER}>"
    return "NovaCRM <noreply@novacrm.local>"


def _verification_html(*, name: str | None, verify_url: str) -> str:
    greeting = f"Hi {name}," if name else "Hi,"
    return f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;color:#4f46e5;">NOVACRM</p>
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;">Verify your email</h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">{greeting}</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
                  Thanks for creating a NovaCRM account. Confirm your email address to continue to workspace setup.
                </p>
                <p style="margin:0 0 28px;">
                  <a href="{verify_url}"
                     style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px;">
                    Verify email address
                  </a>
                </p>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#64748b;">
                  Or paste this link into your browser:
                </p>
                <p style="margin:0 0 24px;font-size:12px;line-height:1.5;word-break:break-all;color:#4f46e5;">
                  {verify_url}
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                  This link expires in 24 hours. If you did not create a NovaCRM account, you can ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def _verification_text(*, name: str | None, verify_url: str) -> str:
    greeting = f"Hi {name}," if name else "Hi,"
    return (
        f"{greeting}\n\n"
        "Thanks for creating a NovaCRM account.\n"
        "Verify your email to continue:\n\n"
        f"{verify_url}\n\n"
        "This link expires in 24 hours.\n"
        "If you did not sign up, you can ignore this email.\n"
    )


def _send_via_resend(*, to_email: str, subject: str, text: str, html: str) -> None:
    response = httpx.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "from": _from_address(),
            "to": [to_email],
            "subject": subject,
            "text": text,
            "html": html,
        },
        timeout=20.0,
    )
    if response.status_code >= 400:
        detail = response.text
        try:
            detail = response.json().get("message") or detail
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to send email: {detail}",
        )


def _send_via_smtp(*, to_email: str, subject: str, text: str, html: str) -> None:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = _from_address()
    message["To"] = to_email
    message.set_content(text)
    message.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to send email via SMTP: {exc}",
        ) from exc


def _require_delivery() -> None:
    if not email_delivery_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Email delivery is not configured. Set RESEND_API_KEY "
                "(or SMTP_HOST, SMTP_USER, SMTP_PASSWORD) in backend/.env."
            ),
        )


def _dispatch(*, to_email: str, subject: str, text: str, html: str) -> None:
    _require_delivery()
    if RESEND_API_KEY:
        _send_via_resend(to_email=to_email, subject=subject, text=text, html=html)
        return
    _send_via_smtp(to_email=to_email, subject=subject, text=text, html=html)


def send_verification_email(*, to_email: str, name: str | None, token: str) -> None:
    verify_url = f"{FRONTEND_URL}/verify-email?token={token}"
    _dispatch(
        to_email=to_email,
        subject="Verify your NovaCRM email",
        text=_verification_text(name=name, verify_url=verify_url),
        html=_verification_html(name=name, verify_url=verify_url),
    )


def _reset_html(*, name: str | None, reset_url: str) -> str:
    greeting = f"Hi {name}," if name else "Hi,"
    return f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;color:#4f46e5;">NOVACRM</p>
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;">Reset your password</h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">{greeting}</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
                  We received a request to reset your NovaCRM password. Click the button below to choose a new one.
                </p>
                <p style="margin:0 0 28px;">
                  <a href="{reset_url}"
                     style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px;">
                    Reset password
                  </a>
                </p>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#64748b;">
                  Or paste this link into your browser:
                </p>
                <p style="margin:0 0 24px;font-size:12px;line-height:1.5;word-break:break-all;color:#4f46e5;">
                  {reset_url}
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                  This link expires in 1 hour. If you did not request a reset, you can ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def _reset_text(*, name: str | None, reset_url: str) -> str:
    greeting = f"Hi {name}," if name else "Hi,"
    return (
        f"{greeting}\n\n"
        "We received a request to reset your NovaCRM password.\n"
        "Use this link to choose a new password:\n\n"
        f"{reset_url}\n\n"
        "This link expires in 1 hour.\n"
        "If you did not request a reset, you can ignore this email.\n"
    )


def send_crm_email(
    *,
    to_email: str,
    subject: str,
    text: str,
    from_name: str | None = None,
    reply_to: str | None = None,
) -> None:
    """Outbound CRM email from the Communications module."""
    del from_name, reply_to
    html = f"<pre style=\"font-family:inherit;white-space:pre-wrap\">{text}</pre>"
    _dispatch(to_email=to_email, subject=subject, text=text, html=html)


def send_password_reset_email(*, to_email: str, name: str | None, token: str) -> None:
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    _dispatch(
        to_email=to_email,
        subject="Reset your NovaCRM password",
        text=_reset_text(name=name, reset_url=reset_url),
        html=_reset_html(name=name, reset_url=reset_url),
    )
