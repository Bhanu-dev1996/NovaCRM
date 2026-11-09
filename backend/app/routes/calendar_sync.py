"""Calendar sync (Google / Microsoft) — OAuth scaffold.

Set provider credentials in environment before using connect flows:
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
  MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REDIRECT_URI
"""

from __future__ import annotations

import os
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse

from app.config import BACKEND_URL, FRONTEND_URL
from app.deps import require_user, require_workspace

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


def _calendar_oauth_redirect_uri(provider: str) -> str:
    """Must match an Authorized redirect URI in Google / Microsoft app settings."""
    p = provider.lower()
    if p == "google":
        custom = os.getenv("GOOGLE_CALENDAR_REDIRECT_URI", "").strip()
        return custom or f"{BACKEND_URL}/api/calendar/oauth/google/callback"
    if p in {"outlook", "microsoft"}:
        custom = os.getenv("MICROSOFT_CALENDAR_REDIRECT_URI", "").strip()
        return custom or f"{BACKEND_URL}/api/calendar/oauth/outlook/callback"
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unknown provider: {provider}",
    )


def _provider_config(provider: str) -> dict:
    p = provider.lower()
    if p == "google":
        return {
            "client_id": os.getenv("GOOGLE_CLIENT_ID", "").strip(),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET", "").strip(),
            "redirect_uri": _calendar_oauth_redirect_uri("google"),
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "scope": "https://www.googleapis.com/auth/calendar",
        }
    if p in {"outlook", "microsoft"}:
        return {
            "client_id": os.getenv("MICROSOFT_CLIENT_ID", "").strip(),
            "client_secret": os.getenv("MICROSOFT_CLIENT_SECRET", "").strip(),
            "redirect_uri": _calendar_oauth_redirect_uri("outlook"),
            "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            "scope": "offline_access Calendars.ReadWrite User.Read",
        }
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unknown provider: {provider}",
    )


@router.get("/connections")
def list_calendar_connections(
    _user: dict = Depends(require_user),
    ctx: dict = Depends(require_workspace),
) -> dict:
    org_id = ctx["organization_id"]
    return {
        "data": [],
        "organization_id": org_id,
        "providers": [
            {
                "id": "google",
                "label": "Google Calendar",
                "configured": bool(os.getenv("GOOGLE_CLIENT_ID", "").strip()),
            },
            {
                "id": "outlook",
                "label": "Microsoft Outlook",
                "configured": bool(os.getenv("MICROSOFT_CLIENT_ID", "").strip()),
            },
        ],
    }


@router.get("/oauth/{provider}/start")
def start_calendar_oauth(
    provider: str,
    _user: dict = Depends(require_user),
    ctx: dict = Depends(require_workspace),
) -> dict:
    cfg = _provider_config(provider)
    if not cfg["client_id"] or not cfg["client_secret"]:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=(
                f"{provider.title()} Calendar sync is not configured on the server. "
                f"Set {provider.upper()}_CLIENT_ID and {provider.upper()}_CLIENT_SECRET."
            ),
        )

    state = f"{ctx['organization_id']}:{_user['id']}"
    params = {
        "client_id": cfg["client_id"],
        "redirect_uri": cfg["redirect_uri"],
        "response_type": "code",
        "scope": cfg["scope"],
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    if provider.lower() in {"outlook", "microsoft"}:
        params.pop("access_type", None)

    url = f"{cfg['auth_url']}?{urlencode(params)}"
    return {"data": {"authorize_url": url}}


@router.get("/oauth/{provider}/callback")
def calendar_oauth_callback(
    provider: str,
    code: str | None = Query(default=None),
    error: str | None = Query(default=None),
    state: str | None = Query(default=None),
) -> RedirectResponse:
    """Browser redirect target after provider login (stores tokens — TODO)."""
    target = f"{FRONTEND_URL.rstrip('/')}/calendar"
    if error:
        return RedirectResponse(f"{target}?sync_error={error}")
    if not code:
        return RedirectResponse(f"{target}?sync_error=missing_code")

    # Token exchange + persistence will land here (Google / Graph APIs).
    return RedirectResponse(
        f"{target}?sync={provider}&sync_state={state or ''}&connected=1"
    )
