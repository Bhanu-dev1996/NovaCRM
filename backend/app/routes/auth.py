from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse, RedirectResponse, Response
from pydantic import BaseModel, EmailStr, Field

from app.auth.session import create_session_token, get_current_user
from app.config import (
    BACKEND_URL,
    FRONTEND_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    SESSION_COOKIE,
    SESSION_MAX_AGE,
)
from app.services.organizations import ensure_user_workspace
from app.services.users import (
    authenticate_email_user,
    create_email_user,
    get_user_by_id,
    upsert_google_user,
)
from app.services.password_reset import (
    get_reset_token_status,
    request_password_reset,
    reset_password_with_token,
)
from app.services.verification import (
    change_unverified_email,
    get_verification_status_by_email,
    resend_verification_email,
    verify_email_token,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


class EmailLoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class EmailRegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str | None = Field(default=None, max_length=120)


class EmailOnlyBody(BaseModel):
    email: EmailStr


class ChangeEmailBody(BaseModel):
    current_email: EmailStr
    new_email: EmailStr


class VerifyTokenBody(BaseModel):
    token: str = Field(min_length=10, max_length=200)


class ResetPasswordBody(BaseModel):
    token: str = Field(min_length=10, max_length=200)
    password: str = Field(min_length=8, max_length=128)


def _google_redirect_uri() -> str:
    return f"{BACKEND_URL}/api/auth/google/callback"


def _require_google_config() -> None:
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured",
        )


def _attach_session(response: Response, user: dict) -> Response:
    token = create_session_token(
        sub=str(user["id"]),
        email=user["email"],
        name=user.get("name") or user["email"],
        picture=user.get("picture"),
    )
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        domain="localhost",
        max_age=SESSION_MAX_AGE,
        path="/",
    )
    return response


@router.post("/register")
def register(body: EmailRegisterBody) -> JSONResponse:
    user = create_email_user(
        email=str(body.email),
        password=body.password,
        name=body.name,
    )
    verification = user.pop("verification", {})
    return JSONResponse(
        {
            "user": {
                "email": user["email"],
                "name": user["name"],
                "email_verified": False,
            },
            "verification": verification,
        }
    )


@router.post("/login")
def login(body: EmailLoginBody) -> JSONResponse:
    user = authenticate_email_user(email=str(body.email), password=body.password)
    ensure_user_workspace(user)
    response = JSONResponse({"user": user})
    return _attach_session(response, user)


@router.get("/verification-status")
def verification_status(email: EmailStr) -> dict:
    return get_verification_status_by_email(str(email))


@router.post("/resend-verification")
def resend_verification(body: EmailOnlyBody) -> dict:
    return resend_verification_email(str(body.email))


@router.post("/change-unverified-email")
def change_email(body: ChangeEmailBody) -> dict:
    return change_unverified_email(
        current_email=str(body.current_email),
        new_email=str(body.new_email),
    )


@router.post("/verify-email")
def verify_email(body: VerifyTokenBody) -> JSONResponse:
    user = verify_email_token(body.token)
    ensure_user_workspace(user)
    response = JSONResponse({"user": user, "status": "verified"})
    return _attach_session(response, user)


@router.post("/forgot-password")
def forgot_password(body: EmailOnlyBody) -> dict:
    return request_password_reset(str(body.email))


@router.get("/reset-password-status")
def reset_password_status(token: str) -> dict:
    return get_reset_token_status(token)


@router.post("/reset-password")
def reset_password(body: ResetPasswordBody) -> dict:
    return reset_password_with_token(token=body.token, password=body.password)


@router.get("/google")
def google_login() -> RedirectResponse:
    _require_google_config()
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": _google_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
    }
    return RedirectResponse(url=f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/google/callback")
async def google_callback(code: str | None = None, error: str | None = None):
    if error:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error={error}",
            status_code=status.HTTP_302_FOUND,
        )

    if not code:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=OAuthCallback",
            status_code=status.HTTP_302_FOUND,
        )

    _require_google_config()

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            token_response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": _google_redirect_uri(),
                    "grant_type": "authorization_code",
                },
                headers={"Accept": "application/json"},
            )
            token_response.raise_for_status()
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            if not access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing access token",
                )

            userinfo_response = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            userinfo_response.raise_for_status()
            profile = userinfo_response.json()
    except Exception:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=OAuthCallback",
            status_code=status.HTTP_302_FOUND,
        )

    email = profile.get("email")
    google_id = profile.get("sub")
    if not email or not google_id:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=OAuthCallback",
            status_code=status.HTTP_302_FOUND,
        )

    try:
        user = upsert_google_user(
            google_id=google_id,
            email=email,
            name=profile.get("name") or email,
            picture=profile.get("picture"),
        )
        ensure_user_workspace(user)
    except HTTPException:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/login?error=Configuration",
            status_code=status.HTTP_302_FOUND,
        )

    response = RedirectResponse(
        url=f"{FRONTEND_URL}/",
        status_code=status.HTTP_302_FOUND,
    )
    return _attach_session(response, user)


@router.get("/me")
def me(request: Request) -> dict:
    session_user = get_current_user(request)
    db_user = get_user_by_id(session_user["id"])
    return {"user": db_user or session_user}


@router.post("/logout")
def logout() -> JSONResponse:
    response = JSONResponse({"ok": True})
    response.delete_cookie(
        key=SESSION_COOKIE,
        domain="localhost",
        path="/",
    )
    return response
