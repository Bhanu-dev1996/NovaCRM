import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.auth.passwords import hash_password
from app.db import fetch_one
from app.services.email import send_password_reset_email

RESET_TOKEN_TTL_HOURS = 1
GENERIC_RESPONSE = {
    "ok": True,
    "message": (
        "If an account exists for that email, "
        "we've sent a password reset link."
    ),
}


def _as_datetime(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
    if isinstance(value, str):
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed
    return value


def _get_reset_user(token: str) -> dict:
    user = fetch_one(
        """
        select id, email, name, reset_token, reset_expires_at
        from users
        where reset_token = %s
        limit 1
        """,
        (token.strip(),),
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "RESET_INVALID",
                "message": "This reset link is invalid or has already been used.",
            },
        )

    expires_at = _as_datetime(user.get("reset_expires_at"))
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "RESET_EXPIRED",
                "message": "This reset link has expired. Request a new one.",
            },
        )

    return user


def get_reset_token_status(token: str) -> dict:
    user = _get_reset_user(token)
    return {
        "ok": True,
        "status": "valid",
        "email": user["email"],
    }


def reset_password_with_token(*, token: str, password: str) -> dict:
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters.",
        )

    user = _get_reset_user(token)
    password_digest = hash_password(password)

    updated = fetch_one(
        """
        update users
        set password_hash = %s,
            reset_token = null,
            reset_expires_at = null,
            email_verified = true,
            verification_token = null,
            verification_expires_at = null,
            updated_at = now()
        where id = %s
        returning id, email
        """,
        (password_digest, user["id"]),
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update password.",
        )

    return {
        "ok": True,
        "status": "reset",
        "message": "Your password has been updated.",
    }


def request_password_reset(email: str) -> dict:
    """
    Always returns the same payload so callers cannot detect whether
    an account exists. Sends mail only for password-based accounts.
    """
    normalized = email.strip().lower()
    user = fetch_one(
        """
        select id, email, name, password_hash
        from users
        where lower(email) = lower(%s)
        limit 1
        """,
        (normalized,),
    )

    # No account, Google-only, or missing password — still look successful.
    if not user or not user.get("password_hash"):
        return GENERIC_RESPONSE

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_TTL_HOURS)

    updated = fetch_one(
        """
        update users
        set reset_token = %s,
            reset_expires_at = %s,
            reset_sent_at = now(),
            updated_at = now()
        where id = %s
        returning id, email, name, reset_token
        """,
        (token, expires_at, user["id"]),
    )
    if not updated:
        return GENERIC_RESPONSE

    reset_url = f"token={token}"
    print(f"[NovaCRM] Password reset link for {updated['email']}: /reset-password?{reset_url}")

    try:
        send_password_reset_email(
            to_email=updated["email"],
            name=updated.get("name"),
            token=token,
        )
    except Exception as exc:
        # Do not leak account existence through delivery errors.
        print(f"[NovaCRM] Password reset email failed for {updated['email']}: {exc}")

    return GENERIC_RESPONSE
