from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status
from psycopg.types.json import Jsonb

from app.db import get_connection, serialize_row, serialize_rows
from app.services.mkt_performance import (
    append_status_event,
    build_simulated_performance,
    performance_has_delivery,
)
from app.services.mkt_seed_data import seed_marketing_demo

CAMPAIGN_STATUSES = {
    "draft",
    "scheduled",
    "active",
    "completed",
    "archived",
    "ready_for_review",
}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _json_obj(val: Any) -> dict:
    return val if isinstance(val, dict) else {}


def _json_list(val: Any) -> list:
    return val if isinstance(val, list) else []


def _segment_to_client(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "description": row.get("description") or "",
        "segmentType": row.get("segment_type") or "dynamic",
        "filters": _json_obj(row.get("filters")),
        "contactIds": [str(x) for x in _json_list(row.get("contact_ids"))],
        "ownerId": str(row["owner_id"]) if row.get("owner_id") else "",
        "contactCount": int(row.get("contact_count") or 0),
        "archived": bool(row.get("archived")),
        "updatedAt": row.get("updated_at"),
        "createdAt": row.get("created_at"),
    }


def _template_to_client(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "category": row.get("category") or "General",
        "subject": row.get("subject") or "",
        "body": row.get("body") or "",
        "visibility": row.get("visibility") or "workspace",
        "ownerId": str(row["owner_id"]) if row.get("owner_id") else "",
        "archived": bool(row.get("archived")),
        "updatedAt": row.get("updated_at"),
        "createdAt": row.get("created_at"),
    }


def _campaign_to_client(row: dict, *, segment_name: str = "") -> dict:
    perf = _json_obj(row.get("performance"))
    has_delivery = performance_has_delivery(perf)
    delivered = int(perf.get("delivered") or 0)
    opens = int(perf.get("opens") or 0)
    clicks = int(perf.get("clicks") or 0)
    recipients = int(perf.get("recipients") or 0)
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "objective": row.get("objective") or "",
        "campaignType": row.get("campaign_type") or "email",
        "description": row.get("description") or "",
        "status": row.get("status") or "draft",
        "ownerId": str(row["owner_id"]) if row.get("owner_id") else "",
        "segmentId": str(row["segment_id"]) if row.get("segment_id") else "",
        "segmentName": segment_name,
        "audience": _json_obj(row.get("audience")),
        "content": _json_obj(row.get("content")),
        "schedule": _json_obj(row.get("schedule")),
        "linkedRecords": _json_obj(row.get("linked_records")),
        "performance": perf,
        "hasDeliveryData": has_delivery,
        "performanceRates": {
            "deliveryRate": (delivered / recipients) if recipients else None,
            "openRate": (opens / delivered) if delivered else None,
            "clickRate": (clicks / delivered) if delivered else None,
            "clickToOpenRate": (clicks / opens) if opens else None,
        },
        "estimatedRecipients": int(row.get("estimated_recipients") or 0),
        "scheduledAt": row.get("scheduled_at"),
        "createdAt": row.get("created_at"),
        "updatedAt": row.get("updated_at"),
    }


def _matches_condition(contact: dict, company: dict | None, condition: dict) -> bool:
    field = (condition.get("field") or "").lower()
    op = (condition.get("operator") or "equals").lower()
    val = condition.get("value")
    val_s = "" if val is None else str(val).strip().lower()

    def s(x: Any) -> str:
        return "" if x is None else str(x).strip().lower()

    if field == "has_email":
        has = bool(contact.get("email"))
        return has if op in {"is_true", "equals", "eq"} else not has
    if field == "owner":
        return s(contact.get("owner_id")) == val_s
    if field == "company":
        return s(contact.get("company_id")) == val_s or s(company and company.get("name")) == val_s
    if field == "industry":
        return s(company and company.get("industry")) == val_s
    if field == "country":
        return s(company and company.get("domain")) == val_s
    if field == "created_date":
        try:
            created = contact.get("created_at")
            if isinstance(created, str):
                created = datetime.fromisoformat(created.replace("Z", "+00:00")).date()
            elif isinstance(created, datetime):
                created = created.date()
            target = date.fromisoformat(str(val))
            if op == "before":
                return created < target
            if op == "after":
                return created > target
            return created == target
        except (ValueError, TypeError):
            return False
    return True


def preview_segment_contacts(
    *,
    organization_id: str,
    segment_type: str,
    filters: dict | None,
    contact_ids: list[str] | None,
) -> dict[str, Any]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select c.*, co.industry as company_industry, co.name as company_name
                from contacts c
                left join companies co on co.id = c.company_id
                where c.organization_id = %s
                order by c.created_at desc
                limit 2000
                """,
                (organization_id,),
            )
            rows = serialize_rows(cursor.fetchall())

    if segment_type == "static" and contact_ids:
        id_set = {str(x) for x in contact_ids}
        matched = [r for r in rows if str(r["id"]) in id_set]
    else:
        conditions = _json_obj(filters).get("conditions") or []
        logic = (_json_obj(filters).get("logic") or "and").lower()
        matched = []
        for row in rows:
            company = {
                "industry": row.get("company_industry"),
                "name": row.get("company_name"),
            }
            if not conditions:
                matched.append(row)
                continue
            results = [
                _matches_condition(row, company, cond)
                for cond in conditions
                if cond.get("field")
            ]
            if not results:
                matched.append(row)
                continue
            ok = all(results) if logic == "and" else any(results)
            if ok:
                matched.append(row)

    suppressed = 0
    consent_missing = len(matched)
    preview = [
        {
            "id": str(r["id"]),
            "name": " ".join(
                x for x in [r.get("first_name"), r.get("last_name")] if x
            ).strip()
            or r.get("email")
            or "Contact",
            "email": r.get("email") or "",
            "companyName": r.get("company_name") or "",
        }
        for r in matched[:50]
    ]
    return {
        "count": len(matched),
        "suppressedExcluded": suppressed,
        "consentMissingWarning": consent_missing > 0,
        "preview": preview,
        "deliveryDisabled": True,
    }


def load_marketing_state(*, organization_id: str) -> dict[str, Any]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "select count(*)::int as n from mkt_campaigns where organization_id = %s",
                (organization_id,),
            )
            has_any = (cursor.fetchone() or {}).get("n", 0) > 0
            if not has_any:
                try:
                    seed_marketing_demo(cursor, organization_id)
                    connection.commit()
                except Exception:
                    connection.rollback()

            cursor.execute(
                """
                select c.*, s.name as segment_name
                from mkt_campaigns c
                left join mkt_segments s on s.id = c.segment_id
                where c.organization_id = %s
                order by c.updated_at desc
                limit 500
                """,
                (organization_id,),
            )
            campaign_rows = serialize_rows(cursor.fetchall())
            backfilled = False
            for r in campaign_rows:
                if r.get("status") != "completed":
                    continue
                perf = _json_obj(r.get("performance"))
                if performance_has_delivery(perf):
                    continue
                recorded = build_simulated_performance(
                    campaign_id=str(r["id"]),
                    estimated_recipients=int(r.get("estimated_recipients") or 0),
                    campaign_type=r.get("campaign_type") or "email",
                    existing=perf,
                )
                recorded = append_status_event(
                    recorded,
                    status="completed",
                    previous_status=None,
                )
                cursor.execute(
                    """
                    update mkt_campaigns
                    set performance = %s::jsonb, updated_at = %s
                    where organization_id = %s and id = %s
                    """,
                    (Jsonb(recorded), _utc_now(), organization_id, r["id"]),
                )
                r["performance"] = recorded
                backfilled = True
            if backfilled:
                connection.commit()

            campaigns = [
                _campaign_to_client(r, segment_name=r.get("segment_name") or "")
                for r in campaign_rows
            ]

            cursor.execute(
                """
                select * from mkt_segments
                where organization_id = %s and archived = false
                order by updated_at desc
                limit 200
                """,
                (organization_id,),
            )
            segments = [_segment_to_client(r) for r in serialize_rows(cursor.fetchall())]

            cursor.execute(
                """
                select * from mkt_templates
                where organization_id = %s and archived = false
                order by updated_at desc
                limit 200
                """,
                (organization_id,),
            )
            templates = [_template_to_client(r) for r in serialize_rows(cursor.fetchall())]

    active = [c for c in campaigns if c["status"] == "active"]
    completed = [c for c in campaigns if c["status"] == "completed"]
    total_audience = sum(s["contactCount"] for s in segments)
    with_perf = [c for c in campaigns if c.get("hasDeliveryData")]
    total_opens = sum(int((c.get("performance") or {}).get("opens") or 0) for c in with_perf)
    total_clicks = sum(int((c.get("performance") or {}).get("clicks") or 0) for c in with_perf)
    return {
        "campaigns": campaigns,
        "segments": segments,
        "templates": templates,
        "metrics": {
            "totalCampaigns": len([c for c in campaigns if c["status"] != "archived"]),
            "activeCampaigns": len(active),
            "totalAudience": total_audience,
            "campaignsCompleted": len(completed),
            "totalOpens": total_opens,
            "totalClicks": total_clicks,
        },
        "phase1Notice": (
            "Bulk delivery is disabled in Phase 1. Save drafts and mark campaigns "
            "ready for review; connect an email provider when you are ready to send."
        ),
    }


def get_campaign(*, organization_id: str, campaign_id: str) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select c.*, s.name as segment_name
                from mkt_campaigns c
                left join mkt_segments s on s.id = c.segment_id
                where c.organization_id = %s and c.id = %s
                limit 1
                """,
                (organization_id, campaign_id),
            )
            row = serialize_row(cursor.fetchone())
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return _campaign_to_client(row, segment_name=row.get("segment_name") or "")


def _campaign_body_to_db(body: dict) -> dict[str, Any]:
    return {
        "name": body.get("name") or "Untitled campaign",
        "objective": body.get("objective") or "",
        "campaign_type": body.get("campaign_type") or body.get("campaignType") or "email",
        "description": body.get("description") or "",
        "status": body.get("status") or "draft",
        "owner_id": body.get("owner_id") or body.get("ownerId") or None,
        "segment_id": body.get("segment_id") or body.get("segmentId") or None,
        "audience": Jsonb(_json_obj(body.get("audience"))),
        "content": Jsonb(_json_obj(body.get("content"))),
        "schedule": Jsonb(_json_obj(body.get("schedule"))),
        "linked_records": Jsonb(_json_obj(body.get("linkedRecords") or body.get("linked_records"))),
        "performance": Jsonb(_json_obj(body.get("performance"))),
        "estimated_recipients": int(
            body.get("estimated_recipients") or body.get("estimatedRecipients") or 0
        ),
        "scheduled_at": body.get("scheduled_at") or body.get("scheduledAt"),
    }


def create_campaign(*, organization_id: str, body: dict) -> dict:
    row_id = str(uuid4())
    now = _utc_now()
    db = _campaign_body_to_db(body)
    if db["status"] not in CAMPAIGN_STATUSES:
        db["status"] = "draft"
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                insert into mkt_campaigns (
                  id, organization_id, name, objective, campaign_type, description,
                  status, owner_id, segment_id, audience, content, schedule,
                  linked_records, performance, estimated_recipients, scheduled_at, updated_at
                ) values (
                  %s, %s, %s, %s, %s, %s,
                  %s, %s, %s, %s, %s, %s,
                  %s, %s, %s, %s, %s
                )
                returning *
                """,
                (
                    row_id,
                    organization_id,
                    db["name"],
                    db["objective"],
                    db["campaign_type"],
                    db["description"],
                    db["status"],
                    db["owner_id"],
                    db["segment_id"],
                    db["audience"],
                    db["content"],
                    db["schedule"],
                    db["linked_records"],
                    db["performance"],
                    db["estimated_recipients"],
                    db["scheduled_at"],
                    now,
                ),
            )
            row = serialize_row(cursor.fetchone())
            connection.commit()
    return get_campaign(organization_id=organization_id, campaign_id=str(row["id"]))


def record_campaign_performance(*, organization_id: str, campaign_id: str) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select id, status, campaign_type, estimated_recipients, performance
                from mkt_campaigns
                where organization_id = %s and id = %s
                limit 1
                """,
                (organization_id, campaign_id),
            )
            row = serialize_row(cursor.fetchone())
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if row.get("status") not in {"completed", "active", "ready_for_review"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Record metrics after the campaign is ready for review or completed.",
        )
    perf = _json_obj(row.get("performance"))
    recorded = build_simulated_performance(
        campaign_id=str(row["id"]),
        estimated_recipients=int(row.get("estimated_recipients") or 0),
        campaign_type=row.get("campaign_type") or "email",
        existing=perf,
    )
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                update mkt_campaigns
                set performance = %s::jsonb, updated_at = %s
                where organization_id = %s and id = %s
                returning id
                """,
                (Jsonb(recorded), _utc_now(), organization_id, campaign_id),
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
            connection.commit()
    return get_campaign(organization_id=organization_id, campaign_id=campaign_id)


def update_campaign(*, organization_id: str, campaign_id: str, patch: dict) -> dict:
    allowed = {
        "name",
        "objective",
        "campaign_type",
        "campaignType",
        "description",
        "status",
        "owner_id",
        "ownerId",
        "segment_id",
        "segmentId",
        "audience",
        "content",
        "schedule",
        "linked_records",
        "linkedRecords",
        "estimated_recipients",
        "estimatedRecipients",
        "scheduled_at",
        "scheduledAt",
        "performance",
    }
    clean = {k: v for k, v in patch.items() if k in allowed}
    if not clean:
        return get_campaign(organization_id=organization_id, campaign_id=campaign_id)

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select status, campaign_type, estimated_recipients, performance
                from mkt_campaigns
                where organization_id = %s and id = %s
                limit 1
                """,
                (organization_id, campaign_id),
            )
            current = serialize_row(cursor.fetchone())
            if not current:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

            perf_override: dict | None = None
            if "status" in clean and clean["status"] != current.get("status"):
                perf = _json_obj(current.get("performance"))
                perf = append_status_event(
                    perf,
                    status=str(clean["status"]),
                    previous_status=current.get("status"),
                )
                if (
                    clean["status"] == "completed"
                    and not performance_has_delivery(perf)
                ):
                    perf = build_simulated_performance(
                        campaign_id=campaign_id,
                        estimated_recipients=int(current.get("estimated_recipients") or 0),
                        campaign_type=current.get("campaign_type") or "email",
                        existing=perf,
                    )
                perf_override = perf

            sets: list[str] = []
            values: list[Any] = []
            mapping = {
                "campaignType": "campaign_type",
                "ownerId": "owner_id",
                "segmentId": "segment_id",
                "linkedRecords": "linked_records",
                "estimatedRecipients": "estimated_recipients",
                "scheduledAt": "scheduled_at",
            }
            for key, val in clean.items():
                col = mapping.get(key, key)
                if col in {"audience", "content", "schedule", "linked_records", "performance"}:
                    val = Jsonb(_json_obj(val))
                sets.append(f"{col} = %s")
                values.append(val)

            if perf_override is not None and "performance" not in clean:
                sets.append("performance = %s")
                values.append(Jsonb(perf_override))

            sets.append("updated_at = %s")
            values.append(_utc_now())
            values.extend([organization_id, campaign_id])

            cursor.execute(
                f"""
                update mkt_campaigns
                set {", ".join(sets)}
                where organization_id = %s and id = %s
                returning id
                """,
                values,
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
            connection.commit()
    return get_campaign(organization_id=organization_id, campaign_id=campaign_id)


def duplicate_campaign(*, organization_id: str, campaign_id: str) -> dict:
    src = get_campaign(organization_id=organization_id, campaign_id=campaign_id)
    body = {
        **src,
        "name": f"{src['name']} (copy)",
        "status": "draft",
        "performance": {},
    }
    return create_campaign(organization_id=organization_id, body=body)


def delete_campaign(*, organization_id: str, campaign_id: str) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                delete from mkt_campaigns
                where organization_id = %s and id = %s and status = 'draft'
                returning id
                """,
                (organization_id, campaign_id),
            )
            row = cursor.fetchone()
            connection.commit()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft campaigns can be deleted",
        )
    return {"ok": True, "id": campaign_id}


def upsert_segment(*, organization_id: str, body: dict, segment_id: str | None = None) -> dict:
    now = _utc_now()
    filters = _json_obj(body.get("filters"))
    contact_ids = body.get("contactIds") or body.get("contact_ids") or []
    segment_type = body.get("segmentType") or body.get("segment_type") or "dynamic"
    preview = preview_segment_contacts(
        organization_id=organization_id,
        segment_type=segment_type,
        filters=filters,
        contact_ids=contact_ids,
    )
    count = preview["count"]
    payload = (
        body.get("name") or "Untitled segment",
        body.get("description") or "",
        segment_type,
        Jsonb(filters),
        Jsonb(contact_ids),
        body.get("ownerId") or body.get("owner_id"),
        count,
        bool(body.get("archived")),
        now,
    )

    with get_connection() as connection:
        with connection.cursor() as cursor:
            if segment_id:
                cursor.execute(
                    """
                    update mkt_segments
                    set name = %s, description = %s, segment_type = %s,
                        filters = %s, contact_ids = %s, owner_id = %s,
                        contact_count = %s, archived = %s, updated_at = %s
                    where organization_id = %s and id = %s
                    returning *
                    """,
                    (*payload, organization_id, segment_id),
                )
            else:
                segment_id = str(uuid4())
                cursor.execute(
                    """
                    insert into mkt_segments (
                      id, organization_id, name, description, segment_type,
                      filters, contact_ids, owner_id, contact_count, archived, updated_at
                    ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    returning *
                    """,
                    (segment_id, organization_id, *payload),
                )
            row = serialize_row(cursor.fetchone())
            connection.commit()
    return _segment_to_client(row)


def upsert_template(*, organization_id: str, body: dict, template_id: str | None = None) -> dict:
    now = _utc_now()
    with get_connection() as connection:
        with connection.cursor() as cursor:
            if template_id:
                cursor.execute(
                    """
                    update mkt_templates
                    set name = %s, category = %s, subject = %s, body = %s,
                        visibility = %s, owner_id = %s, archived = %s, updated_at = %s
                    where organization_id = %s and id = %s
                    returning *
                    """,
                    (
                        body.get("name"),
                        body.get("category") or "General",
                        body.get("subject") or "",
                        body.get("body") or "",
                        body.get("visibility") or "workspace",
                        body.get("ownerId") or body.get("owner_id"),
                        bool(body.get("archived")),
                        now,
                        organization_id,
                        template_id,
                    ),
                )
            else:
                template_id = str(uuid4())
                cursor.execute(
                    """
                    insert into mkt_templates (
                      id, organization_id, name, category, subject, body,
                      visibility, owner_id, archived, updated_at
                    ) values (%s, %s, %s, %s, %s, %s, %s, %s, false, %s)
                    returning *
                    """,
                    (
                        template_id,
                        organization_id,
                        body.get("name") or "Untitled",
                        body.get("category") or "General",
                        body.get("subject") or "",
                        body.get("body") or "",
                        body.get("visibility") or "workspace",
                        body.get("ownerId") or body.get("owner_id"),
                        now,
                    ),
                )
            row = serialize_row(cursor.fetchone())
            connection.commit()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return _template_to_client(row)


def delete_template(*, organization_id: str, template_id: str) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                delete from mkt_templates
                where organization_id = %s and id = %s
                returning id
                """,
                (organization_id, template_id),
            )
            row = cursor.fetchone()
            connection.commit()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return {"ok": True, "id": template_id}
