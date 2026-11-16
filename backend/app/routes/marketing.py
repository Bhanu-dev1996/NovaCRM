from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.deps import require_workspace
from app.services import marketing as mkt_svc

router = APIRouter(prefix="/api/marketing", tags=["marketing"])


class SegmentPreviewBody(BaseModel):
    segmentType: str = "dynamic"
    filters: dict[str, Any] | None = None
    contactIds: list[str] | None = None


class SegmentBody(BaseModel):
    name: str = Field(min_length=1)
    description: str | None = None
    segmentType: str = "dynamic"
    filters: dict[str, Any] | None = None
    contactIds: list[str] | None = None
    ownerId: str | None = None
    archived: bool | None = None


class TemplateBody(BaseModel):
    name: str = Field(min_length=1)
    category: str = "General"
    subject: str = ""
    body: str = ""
    visibility: str = "workspace"
    ownerId: str | None = None
    archived: bool | None = None


class CampaignBody(BaseModel):
    model_config = {"extra": "allow"}


@router.get("")
def get_marketing_state(ctx: dict = Depends(require_workspace)) -> dict:
    state = mkt_svc.load_marketing_state(organization_id=ctx["organization_id"])
    return {"data": state}


@router.get("/campaigns/{campaign_id}")
def get_campaign(campaign_id: str, ctx: dict = Depends(require_workspace)) -> dict:
    row = mkt_svc.get_campaign(
        organization_id=ctx["organization_id"],
        campaign_id=campaign_id,
    )
    return {"data": row}


@router.post("/campaigns")
def create_campaign(
    body: CampaignBody,
    ctx: dict = Depends(require_workspace),
) -> dict:
    row = mkt_svc.create_campaign(
        organization_id=ctx["organization_id"],
        body=body.model_dump(exclude_unset=True),
    )
    return {"data": row}


@router.patch("/campaigns/{campaign_id}")
def patch_campaign(
    campaign_id: str,
    body: CampaignBody,
    ctx: dict = Depends(require_workspace),
) -> dict:
    row = mkt_svc.update_campaign(
        organization_id=ctx["organization_id"],
        campaign_id=campaign_id,
        patch=body.model_dump(exclude_unset=True),
    )
    return {"data": row}


@router.post("/campaigns/{campaign_id}/record-performance")
def record_campaign_performance(
    campaign_id: str,
    ctx: dict = Depends(require_workspace),
) -> dict:
    row = mkt_svc.record_campaign_performance(
        organization_id=ctx["organization_id"],
        campaign_id=campaign_id,
    )
    return {"data": row}


@router.post("/campaigns/{campaign_id}/duplicate")
def duplicate_campaign(campaign_id: str, ctx: dict = Depends(require_workspace)) -> dict:
    row = mkt_svc.duplicate_campaign(
        organization_id=ctx["organization_id"],
        campaign_id=campaign_id,
    )
    return {"data": row}


@router.delete("/campaigns/{campaign_id}")
def remove_campaign(campaign_id: str, ctx: dict = Depends(require_workspace)) -> dict:
    return mkt_svc.delete_campaign(
        organization_id=ctx["organization_id"],
        campaign_id=campaign_id,
    )


@router.post("/segments/preview")
def preview_segment(body: SegmentPreviewBody, ctx: dict = Depends(require_workspace)) -> dict:
    data = mkt_svc.preview_segment_contacts(
        organization_id=ctx["organization_id"],
        segment_type=body.segmentType,
        filters=body.filters,
        contact_ids=body.contactIds,
    )
    return {"data": data}


@router.post("/segments")
def create_segment(body: SegmentBody, ctx: dict = Depends(require_workspace)) -> dict:
    row = mkt_svc.upsert_segment(
        organization_id=ctx["organization_id"],
        body=body.model_dump(exclude_unset=True),
    )
    return {"data": row}


@router.patch("/segments/{segment_id}")
def patch_segment(
    segment_id: str,
    body: SegmentBody,
    ctx: dict = Depends(require_workspace),
) -> dict:
    row = mkt_svc.upsert_segment(
        organization_id=ctx["organization_id"],
        body=body.model_dump(exclude_unset=True),
        segment_id=segment_id,
    )
    return {"data": row}


@router.post("/templates")
def create_template(body: TemplateBody, ctx: dict = Depends(require_workspace)) -> dict:
    row = mkt_svc.upsert_template(
        organization_id=ctx["organization_id"],
        body=body.model_dump(exclude_unset=True),
    )
    return {"data": row}


@router.patch("/templates/{template_id}")
def patch_template(
    template_id: str,
    body: TemplateBody,
    ctx: dict = Depends(require_workspace),
) -> dict:
    row = mkt_svc.upsert_template(
        organization_id=ctx["organization_id"],
        body=body.model_dump(exclude_unset=True),
        template_id=template_id,
    )
    return {"data": row}


@router.delete("/templates/{template_id}")
def delete_template(template_id: str, ctx: dict = Depends(require_workspace)) -> dict:
    return mkt_svc.delete_template(
        organization_id=ctx["organization_id"],
        template_id=template_id,
    )
