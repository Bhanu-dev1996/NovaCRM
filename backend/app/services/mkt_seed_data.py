"""Demo marketing data for empty workspaces."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from psycopg.types.json import Jsonb


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _days_ahead(days: int, hour: int = 10, minute: int = 0) -> datetime:
    base = _utc_now().replace(hour=hour, minute=minute, second=0, microsecond=0)
    return base + timedelta(days=days)


def _days_ago(days: int) -> datetime:
    return _utc_now() - timedelta(days=days)


def seed_marketing_demo(cursor, organization_id: str) -> None:
    seg_news_id = str(uuid4())
    seg_pilot_id = str(uuid4())
    tpl_intro_id = str(uuid4())
    tpl_event_id = str(uuid4())
    now = _utc_now()

    cursor.execute(
        """
        insert into mkt_segments (
          id, organization_id, name, description, segment_type, filters,
          contact_ids, contact_count, updated_at
        ) values
        (%s, %s, %s, %s, 'dynamic', %s, '[]'::jsonb, 42, %s),
        (%s, %s, %s, %s, 'dynamic', %s, '[]'::jsonb, 18, %s)
        """,
        (
            seg_news_id,
            organization_id,
            "Newsletter subscribers",
            "Contacts with email on file in active accounts",
            Jsonb(
                {
                    "logic": "and",
                    "conditions": [
                        {"field": "has_email", "operator": "is_true", "value": ""}
                    ],
                }
            ),
            now,
            seg_pilot_id,
            organization_id,
            "Pilot region — Finance",
            "Finance industry companies for product pilot",
            Jsonb(
                {
                    "logic": "and",
                    "conditions": [
                        {"field": "industry", "operator": "equals", "value": "Finance"}
                    ],
                }
            ),
            now,
        ),
    )

    cursor.execute(
        """
        insert into mkt_templates (
          id, organization_id, name, category, subject, body, visibility, updated_at
        ) values
        (%s, %s, %s, %s, %s, %s, 'workspace', %s),
        (%s, %s, %s, %s, %s, %s, 'workspace', %s)
        """,
        (
            tpl_intro_id,
            organization_id,
            "Product introduction",
            "Announcement",
            "Introducing what's new at {{company.name}}",
            "Hi {{contact.first_name}},\n\nWe're excited to share updates designed for teams like yours.\n\n— NovaCRM Marketing",
            now,
            tpl_event_id,
            organization_id,
            "Webinar invitation",
            "Event",
            "You're invited: {{campaign.name}}",
            "Join us for a live session on modern revenue workflows.\n\nRegister to save your spot.",
            now,
        ),
    )

    campaigns = [
        {
            "id": str(uuid4()),
            "name": "Q1 Newsletter",
            "objective": "Nurture existing contacts with product updates",
            "campaign_type": "newsletter",
            "status": "scheduled",
            "segment_id": seg_news_id,
            "estimated_recipients": 42,
            "scheduled_at": _days_ahead(5),
            "content": {
                "subject": "Your Q1 NovaCRM digest",
                "previewText": "Feature highlights and customer stories",
                "senderName": "NovaCRM Marketing",
                "senderEmail": "marketing@novacrm.app",
                "body": "Hi {{contact.first_name}},\n\nHere's what shipped this quarter…",
                "templateId": str(tpl_intro_id),
            },
            "schedule": {
                "sendDate": _days_ahead(5).date().isoformat(),
                "sendTime": "10:00",
                "timezone": "America/New_York",
            },
        },
        {
            "id": str(uuid4()),
            "name": "Finance pilot announcement",
            "objective": "Drive registrations for finance vertical pilot",
            "campaign_type": "product_announcement",
            "status": "draft",
            "segment_id": seg_pilot_id,
            "estimated_recipients": 18,
            "content": {
                "subject": "Early access: Finance workflow pack",
                "body": "We're opening a limited pilot for finance teams.",
            },
        },
        {
            "id": str(uuid4()),
            "name": "Spring webinar series",
            "objective": "Book seats for revenue operations webinar",
            "campaign_type": "event",
            "status": "ready_for_review",
            "estimated_recipients": 120,
            "scheduled_at": _days_ahead(12),
            "content": {
                "subject": "Live webinar — Pipeline hygiene in 2026",
                "templateId": str(tpl_event_id),
            },
        },
        {
            "id": str(uuid4()),
            "name": "Re-engagement follow-up",
            "objective": "Win back stalled conversations",
            "campaign_type": "follow_up",
            "status": "completed",
            "estimated_recipients": 65,
            "performance": {},
            "content": {"subject": "Checking in from NovaCRM"},
        },
    ]

    for row in campaigns:
        cursor.execute(
            """
            insert into mkt_campaigns (
              id, organization_id, name, objective, campaign_type, description,
              status, segment_id, audience, content, schedule, linked_records,
              performance, estimated_recipients, scheduled_at, updated_at
            ) values (
              %s, %s, %s, %s, %s, %s,
              %s, %s, '{}'::jsonb, %s::jsonb, %s::jsonb, '{}'::jsonb,
              %s::jsonb, %s, %s, %s
            )
            """,
            (
                row["id"],
                organization_id,
                row["name"],
                row["objective"],
                row["campaign_type"],
                row.get("description") or "",
                row["status"],
                row.get("segment_id"),
                Jsonb(row.get("content") or {}),
                Jsonb(row.get("schedule") or {}),
                Jsonb(row.get("performance") or {}),
                row.get("estimated_recipients") or 0,
                row.get("scheduled_at"),
                _days_ago(3),
            ),
        )
