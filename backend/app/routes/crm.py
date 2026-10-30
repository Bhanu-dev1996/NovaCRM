from typing import Any

from fastapi import APIRouter, Depends, Query, Request, Response
from pydantic import BaseModel, Field

from app.config import FRONTEND_URL, ORGANIZATION_COOKIE, SESSION_MAX_AGE
from app.deps import require_user, require_workspace
from app.services import crud
from app.services.organizations import (
    complete_workspace_setup,
    get_membership,
    list_user_workspaces,
    list_workspace_members,
)

router = APIRouter(prefix="/api", tags=["crm"])


class WorkspaceSetupBody(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    website: str | None = Field(default=None, max_length=255)
    industry: str | None = Field(default=None, max_length=120)
    company_size: str | None = Field(default=None, max_length=60)
    job_role: str | None = Field(default=None, max_length=120)
    logo_url: str | None = None


class WorkspaceSwitchBody(BaseModel):
    organization_id: str = Field(min_length=1)


RESOURCE_MAP = {
    "companies": "companies",
    "contacts": "contacts",
    "pipeline-stages": "pipeline_stages",
    "deals": "deals",
    "leads": "leads",
    "activities": "activities",
    "tasks": "tasks",
}


def _table(resource: str) -> str:
    table = RESOURCE_MAP.get(resource)
    if not table:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown resource: {resource}",
        )
    return table


@router.get("/workspace")
def get_workspace(ctx: dict = Depends(require_workspace)) -> dict:
    organizations = list_user_workspaces(ctx["user"]["id"])
    return {
        "user": ctx["user"],
        "organization": ctx["organization"],
        "role": ctx["role"],
        "organizations": organizations,
    }


@router.post("/workspace/switch")
def switch_workspace(
    body: WorkspaceSwitchBody,
    response: Response,
    user: dict = Depends(require_user),
) -> dict:
    membership = get_membership(user["id"], body.organization_id)
    if not membership:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of that workspace",
        )

    response.set_cookie(
        key=ORGANIZATION_COOKIE,
        value=membership["organization_id"],
        max_age=SESSION_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=FRONTEND_URL.startswith("https://"),
        path="/",
    )
    return {
        "user": user,
        "organization": membership["organization"],
        "role": membership["role"],
        "organizations": list_user_workspaces(user["id"]),
    }


@router.get("/workspace/members")
def get_workspace_members(ctx: dict = Depends(require_workspace)) -> dict:
    return {
        "data": list_workspace_members(ctx["organization_id"]),
        "organization_id": ctx["organization_id"],
        "role": ctx["role"],
    }


@router.patch("/workspace")
def update_workspace(
    body: WorkspaceSetupBody,
    ctx: dict = Depends(require_workspace),
) -> dict:
    if ctx["role"] not in {"owner", "admin"}:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owners and admins can update workspace settings",
        )

    result = complete_workspace_setup(
        organization_id=ctx["organization_id"],
        user_id=ctx["user"]["id"],
        name=body.name,
        website=body.website,
        industry=body.industry,
        company_size=body.company_size,
        job_role=body.job_role,
        logo_url=body.logo_url,
    )
    return {
        "user": {**ctx["user"], "job_role": result.get("job_role")},
        "organization": result["organization"],
        "role": ctx["role"],
        "organizations": list_user_workspaces(ctx["user"]["id"]),
        "status": result["status"],
    }


@router.get("/{resource}")
def list_resource(
    resource: str,
    request: Request,
    ctx: dict = Depends(require_workspace),
    limit: int = Query(100, ge=1, le=500),
    order_by: str | None = None,
) -> dict:
    table = _table(resource)
    filters = {
        key: value
        for key, value in request.query_params.items()
        if key not in {"limit", "order_by"}
    }
    rows = crud.list_rows(
        table,
        organization_id=ctx["organization_id"],
        filters=filters,
        order_by=order_by,
        limit=limit,
    )
    return {"data": rows}


@router.get("/{resource}/{row_id}")
def get_resource(
    resource: str,
    row_id: str,
    ctx: dict = Depends(require_workspace),
) -> dict:
    table = _table(resource)
    row = crud.get_row(
        table, organization_id=ctx["organization_id"], row_id=row_id
    )
    return {"data": row}


@router.post("/{resource}")
def create_resource(
    resource: str,
    payload: dict[str, Any],
    ctx: dict = Depends(require_workspace),
) -> dict:
    table = _table(resource)
    row = crud.create_row(
        table, organization_id=ctx["organization_id"], payload=payload
    )
    return {"data": row}


@router.patch("/{resource}/{row_id}")
def update_resource(
    resource: str,
    row_id: str,
    payload: dict[str, Any],
    ctx: dict = Depends(require_workspace),
) -> dict:
    table = _table(resource)
    row = crud.update_row(
        table,
        organization_id=ctx["organization_id"],
        row_id=row_id,
        payload=payload,
    )
    return {"data": row}


@router.delete("/{resource}/{row_id}")
def delete_resource(
    resource: str,
    row_id: str,
    ctx: dict = Depends(require_workspace),
) -> dict:
    table = _table(resource)
    return crud.delete_row(
        table, organization_id=ctx["organization_id"], row_id=row_id
    )
