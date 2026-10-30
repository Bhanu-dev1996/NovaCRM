import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.config import EMAIL_DEV_LINKS, FRONTEND_URL
from app.db import execute, fetch_one
from app.services.email import send_verification_email

RESEND_COOLDOWN_SECONDS = 60
TOKEN_TTL_HOURS = 24


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


def _mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if not domain:
        return "***"
    visible = local[:1] if local else "*"
    return f"{visible}***@{domain}"


def _public_verification(user: dict, *, include_dev_link: bool = False) -> dict:
    sent_at = _as_datetime(user.get("verification_sent_at"))
    cooldown_remaining = 0
    if sent_at:
        elapsed = (datetime.now(timezone.utc) - sent_at).total_seconds()
        cooldown_remaining = max(0, int(RESEND_COOLDOWN_SECONDS - elapsed))

    payload = {
        "email": user.get("email"),
        "masked_email": _mask_email(user.get("email") or ""),
        "email_verified": bool(user.get("email_verified")),
        "cooldown_remaining": cooldown_remaining,
        "status": "verified" if user.get("email_verified") else "waiting",
    }

    if include_dev_link and user.get("verification_token") and not user.get("email_verified"):
        payload["dev_verify_url"] = (
            f"{FRONTEND_URL}/verify-email?token={user['verification_token']}"
        )

    return payload


def issue_verification_token(user_id: str) -> dict:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS)
    user = fetch_one(
        """
        update users
        set verification_token = %s,
            verification_expires_at = %s,
            verification_sent_at = now(),
            updated_at = now()
        where id = %s
        returning id, email, name, email_verified, verification_token, verification_sent_at
        """,
        (token, expires_at, user_id),
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    verify_url = f"{FRONTEND_URL}/verify-email?token={token}"
    print(f"[NovaCRM] Verification link for {user['email']}: {verify_url}")

    email_sent = False
    try:
        send_verification_email(
            to_email=user["email"],
            name=user.get("name"),
            token=token,
        )
        email_sent = True
    except HTTPException as exc:
        # Resend test sender only delivers to the Resend account email.
        # Keep signup working for other addresses by exposing the local link.
        print(f"[NovaCRM] Verification email not delivered: {exc.detail}")
        if not EMAIL_DEV_LINKS:
            raise

    return _public_verification(
        user,
        include_dev_link=EMAIL_DEV_LINKS or not email_sent,
    )


def get_verification_status_by_email(email: str) -> dict:
    user = fetch_one(
        """
        select id, email, email_verified, verification_token, verification_sent_at,
               verification_expires_at
        from users
        where lower(email) = lower(%s)
        limit 1
        """,
        (email.strip(),),
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for that email",
        )

    expires_at = _as_datetime(user.get("verification_expires_at"))
    if (
        not user.get("email_verified")
        and expires_at
        and expires_at < datetime.now(timezone.utc)
    ):
        return {
            **_public_verification(user, include_dev_link=EMAIL_DEV_LINKS),
            "status": "expired",
        }

    return _public_verification(user, include_dev_link=EMAIL_DEV_LINKS)


def resend_verification_email(email: str) -> dict:
    user = fetch_one(
        """
        select id, email, email_verified, verification_sent_at
        from users
        where lower(email) = lower(%s)
        limit 1
        """,
        (email.strip(),),
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for that email",
        )
    if user.get("email_verified"):
        return {
            **_public_verification({**user, "verification_token": None}),
            "status": "verified",
        }

    sent_at = _as_datetime(user.get("verification_sent_at"))
    if sent_at:
        elapsed = (datetime.now(timezone.utc) - sent_at).total_seconds()
        remaining = int(RESEND_COOLDOWN_SECONDS - elapsed)
        if remaining > 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "message": "Please wait before requesting another email.",
                    "cooldown_remaining": remaining,
                },
            )

    return issue_verification_token(user["id"])


def verify_email_token(token: str) -> dict:
    user = fetch_one(
        """
        select id, email, name, avatar_url, google_id, email_verified,
               verification_token, verification_expires_at
        from users
        where verification_token = %s
        limit 1
        """,
        (token.strip(),),
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link",
            headers={"X-Verification-Status": "error"},
        )

    if user.get("email_verified"):
        return {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name"),
            "picture": user.get("avatar_url"),
            "google_id": user.get("google_id"),
            "email_verified": True,
            "status": "verified",
        }

    expires_at = _as_datetime(user.get("verification_expires_at"))
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "LINK_EXPIRED",
                "message": "This verification link has expired",
                "email": user["email"],
            },
            headers={"X-Verification-Status": "expired"},
        )

    updated = fetch_one(
        """
        update users
        set email_verified = true,
            verification_token = null,
            verification_expires_at = null,
            last_login_at = now(),
            updated_at = now()
        where id = %s
        returning id, email, name, avatar_url, google_id, email_verified
        """,
        (user["id"],),
    )
    return {
        "id": updated["id"],
        "email": updated["email"],
        "name": updated.get("name"),
        "picture": updated.get("avatar_url"),
        "google_id": updated.get("google_id"),
        "email_verified": True,
        "status": "verified",
    }


def change_unverified_email(*, current_email: str, new_email: str) -> dict:
    current = fetch_one(
        """
        select id, email, email_verified
        from users
        where lower(email) = lower(%s)
        limit 1
        """,
        (current_email.strip(),),
    )
    if not current:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for that email",
        )
    if current.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verified accounts cannot change email from this screen",
        )

    taken = fetch_one(
        """
        select id from users
        where lower(email) = lower(%s) and id <> %s
        limit 1
        """,
        (new_email.strip(), current["id"]),
    )
    if taken:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    execute(
        """
        update users
        set email = %s, updated_at = now()
        where id = %s
        """,
        (new_email.lower().strip(), current["id"]),
    )
    return issue_verification_token(current["id"])
