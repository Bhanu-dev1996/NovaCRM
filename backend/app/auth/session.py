from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request, status

from app.config import AUTH_SECRET, SESSION_COOKIE, SESSION_MAX_AGE


def create_session_token(*, sub: str, email: str, name: str, picture: str | None) -> str:
    if not AUTH_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AUTH_SECRET is not configured",
        )

    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "email": email,
        "name": name,
        "picture": picture,
        "iat": now,
        "exp": now + timedelta(seconds=SESSION_MAX_AGE),
    }
    return jwt.encode(payload, AUTH_SECRET, algorithm="HS256")


def decode_session_token(token: str) -> dict:
    if not AUTH_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AUTH_SECRET is not configured",
        )

    try:
        return jwt.decode(token, AUTH_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        ) from exc


def get_current_user(request: Request) -> dict:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    payload = decode_session_token(token)
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "name": payload.get("name"),
        "picture": payload.get("picture"),
    }
