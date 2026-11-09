from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.deps import require_workspace
from app.services import communications as comm_svc

router = APIRouter(prefix="/api/communications", tags=["communications"])


class SettingsPatch(BaseModel):
    channels: dict[str, Any] | None = None
    email: dict[str, Any] | None = None
    notifications: dict[str, Any] | None = None
    permissions: dict[str, Any] | None = None


class ConversationCreate(BaseModel):
    channel: str = "email"
    subject: str | None = None
    contact_id: str | None = None
    company_id: str | None = None
    deal_id: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    company_name: str | None = None
    deal_name: str | None = None
    job_title: str | None = None
    phone: str | None = None
    assignee_id: str | None = None
    starred: bool = False
    archived: bool = False
    last_message_preview: str | None = None
    message: dict[str, Any] | None = None
    send_email: bool = False


class ConversationPatch(BaseModel):
    model_config = {"extra": "allow"}


class MessageCreate(BaseModel):
    direction: str = "outbound"
    body: str = Field(min_length=1)
    channel: str = "email"
    status: str | None = None
    sender_name: str | None = None
    sender_email: str | None = None
    subject: str | None = None
    to_email: str | None = None
    send_email: bool = True


class TemplateBody(BaseModel):
    name: str = Field(min_length=1)
    category: str = "Follow-up"
    subject: str = Field(min_length=1)
    body: str = Field(min_length=1)
    visibility: str = "workspace"


def _settings(ctx: dict) -> dict:
    return comm_svc.load_comm_settings(organization_id=ctx["organization_id"])


@router.get("")
def get_communications_state(ctx: dict = Depends(require_workspace)) -> dict:
    settings = _settings(ctx)
    comm_svc.assert_comm_permission(settings, ctx["role"], "accessConversations")
    state = comm_svc.load_workspace_state(organization_id=ctx["organization_id"])
    return {"data": state}


@router.get("/summary")
def get_inbox_summary(ctx: dict = Depends(require_workspace)) -> dict:
    settings = _settings(ctx)
    comm_svc.assert_comm_permission(settings, ctx["role"], "accessConversations")
    total = comm_svc.inbox_unread_total(organization_id=ctx["organization_id"])
    return {"data": {"unreadTotal": total}}


@router.patch("/settings")
def patch_settings(
    body: SettingsPatch,
    ctx: dict = Depends(require_workspace),
) -> dict:
    if body.permissions is not None and ctx["role"] not in {"owner", "admin"}:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can change team permissions",
        )
    patch = body.model_dump(exclude_unset=True)
    settings = comm_svc.save_settings(
        organization_id=ctx["organization_id"],
        patch=patch,
    )
    return {"data": settings}


@router.post("/conversations")
def create_conversation(
    body: ConversationCreate,
    ctx: dict = Depends(require_workspace),
) -> dict:
    settings = _settings(ctx)
    comm_svc.assert_comm_permission(settings, ctx["role"], "sendEmail")
    payload = body.model_dump(exclude={"message", "send_email"}, exclude_unset=True)
    conv = comm_svc.create_conversation(
        organization_id=ctx["organization_id"],
        body=payload,
        first_message=body.message,
        send_email=body.send_email,
    )
    return {"data": conv}


@router.patch("/conversations/{conversation_id}")
def update_conversation(
    conversation_id: str,
    body: ConversationPatch,
    ctx: dict = Depends(require_workspace),
) -> dict:
    settings = _settings(ctx)
    comm_svc.assert_comm_permission(settings, ctx["role"], "accessConversations")
    conv = comm_svc.update_conversation(
        organization_id=ctx["organization_id"],
        conversation_id=conversation_id,
        patch=body.model_dump(exclude_unset=True),
    )
    return {"data": conv}


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    ctx: dict = Depends(require_workspace),
) -> dict:
    settings = _settings(ctx)
    comm_svc.assert_comm_permission(settings, ctx["role"], "accessConversations")
    return comm_svc.delete_conversation(
        organization_id=ctx["organization_id"],
        conversation_id=conversation_id,
    )


@router.post("/conversations/{conversation_id}/messages")
def post_message(
    conversation_id: str,
    body: MessageCreate,
    ctx: dict = Depends(require_workspace),
) -> dict:
    settings = _settings(ctx)
    comm_svc.assert_comm_permission(settings, ctx["role"], "sendEmail")
    result = comm_svc.create_message(
        organization_id=ctx["organization_id"],
        conversation_id=conversation_id,
        body=body.model_dump(),
        send_email=body.send_email,
        user_id=ctx["user"]["id"],
    )
    return {"data": result}


@router.post("/templates")
def create_template(
    body: TemplateBody,
    ctx: dict = Depends(require_workspace),
) -> dict:
    settings = _settings(ctx)
    comm_svc.assert_comm_permission(settings, ctx["role"], "manageTemplates")
    tpl = comm_svc.upsert_template(
        organization_id=ctx["organization_id"],
        template_id=None,
        body=body.model_dump(),
    )
    return {"data": tpl}


@router.patch("/templates/{template_id}")
def update_template(
    template_id: str,
    body: TemplateBody,
    ctx: dict = Depends(require_workspace),
) -> dict:
    settings = _settings(ctx)
    comm_svc.assert_comm_permission(settings, ctx["role"], "manageTemplates")
    tpl = comm_svc.upsert_template(
        organization_id=ctx["organization_id"],
        template_id=template_id,
        body=body.model_dump(),
    )
    return {"data": tpl}


@router.delete("/templates/{template_id}")
def remove_template(
    template_id: str,
    ctx: dict = Depends(require_workspace),
) -> dict:
    settings = _settings(ctx)
    comm_svc.assert_comm_permission(settings, ctx["role"], "manageTemplates")
    return comm_svc.delete_template(
        organization_id=ctx["organization_id"],
        template_id=template_id,
    )
