from fastapi import Depends, HTTPException, Request, status

from app.auth.session import get_current_user
from app.config import ORGANIZATION_COOKIE
from app.services.organizations import ensure_user_workspace
from app.services.users import get_user_by_id


def require_user(request: Request) -> dict:
    session_user = get_current_user(request)
    db_user = get_user_by_id(session_user["id"])
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return db_user


def require_workspace(
    request: Request,
    user: dict = Depends(require_user),
) -> dict:
    preferred = (request.cookies.get(ORGANIZATION_COOKIE) or "").strip() or None
    workspace = ensure_user_workspace(
        user, preferred_organization_id=preferred
    )
    return {
        "user": user,
        "organization_id": workspace["organization_id"],
        "role": workspace["role"],
        "organization": workspace.get("organization"),
    }
