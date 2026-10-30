from fastapi import HTTPException, status

from app.auth.passwords import hash_password, verify_password
from app.db import execute, fetch_one
from app.services.verification import issue_verification_token


def _public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user.get("email"),
        "name": user.get("name"),
        "picture": user.get("avatar_url"),
        "google_id": user.get("google_id"),
        "email_verified": bool(user.get("email_verified", False)),
        "job_role": user.get("job_role"),
    }


def upsert_google_user(*, google_id: str, email: str, name: str, picture: str | None) -> dict:
    try:
        user = fetch_one(
            """
            insert into users (
              google_id, email, name, avatar_url, email_verified,
              last_login_at, updated_at
            )
            values (%s, %s, %s, %s, true, now(), now())
            on conflict (google_id) do update set
              email = excluded.email,
              name = excluded.name,
              avatar_url = excluded.avatar_url,
              email_verified = true,
              verification_token = null,
              verification_expires_at = null,
              last_login_at = now(),
              updated_at = now()
            returning id, email, name, avatar_url, google_id, email_verified
            """,
            (google_id, email, name, picture),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save user: {exc}",
        ) from exc

    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User upsert returned no row",
        )

    return _public_user(user)


def create_email_user(*, email: str, password: str, name: str | None = None) -> dict:
    existing = fetch_one(
        "select id, password_hash, google_id from users where lower(email) = lower(%s) limit 1",
        (email,),
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    password_digest = hash_password(password)
    display_name = (name or "").strip() or email.split("@")[0]

    try:
        user = fetch_one(
            """
            insert into users (
              email, name, password_hash, email_verified, updated_at
            )
            values (%s, %s, %s, false, now())
            returning id, email, name, avatar_url, google_id, email_verified
            """,
            (email.lower().strip(), display_name, password_digest),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create account: {exc}",
        ) from exc

    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Account creation returned no user",
        )

    verification = issue_verification_token(user["id"])
    return {
        **_public_user(user),
        "verification": verification,
    }


def authenticate_email_user(*, email: str, password: str) -> dict:
    user = fetch_one(
        """
        select id, email, name, avatar_url, google_id, password_hash, email_verified
        from users
        where lower(email) = lower(%s)
        limit 1
        """,
        (email.strip(),),
    )

    if not user or not verify_password(password, user.get("password_hash")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "EMAIL_NOT_VERIFIED",
                "message": "Please verify your email before signing in.",
                "email": user["email"],
            },
        )

    execute(
        """
        update users
        set last_login_at = now(), updated_at = now()
        where id = %s
        """,
        (user["id"],),
    )

    return _public_user(user)


def get_user_by_id(user_id: str) -> dict | None:
    user = fetch_one(
        """
        select id, email, name, avatar_url, google_id, email_verified, job_role
        from users
        where id = %s
        limit 1
        """,
        (user_id,),
    )
    if not user:
        return None
    return _public_user(user)
