"""Sync logged call activities into Communications inbox (channel=call)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from psycopg.types.json import Jsonb

from app.db import get_connection, serialize_row, serialize_rows


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _meta_dict(raw: Any) -> dict[str, Any]:
    if isinstance(raw, dict):
        return raw
    return {}


def call_activity_qualifies(activity: dict[str, Any]) -> bool:
    if (activity.get("type") or "").lower() != "call":
        return False
    status = (activity.get("status") or "").strip().lower()
    meta = _meta_dict(activity.get("meta"))
    if activity.get("completed_at"):
        return True
    if status in {"logged", "completed"}:
        return True
    if meta.get("logged") in (True, "true", 1):
        return True
    if (meta.get("callMode") or "").lower() == "log":
        return True
    return False


def _clean_subject(subject: str | None) -> str:
    text = (subject or "Call").strip()
    if text.lower().startswith("[seed]"):
        text = text[6:].strip()
    return text or "Call"


def _call_preview(activity: dict[str, Any]) -> str:
    meta = _meta_dict(activity.get("meta"))
    status = (activity.get("status") or "Logged").strip()
    duration = meta.get("durationMinutes") or meta.get("duration") or meta.get("duration_minutes")
    parts = ["Call"]
    if duration:
        try:
            parts.append(f"{int(duration)} min")
        except (TypeError, ValueError):
            pass
    if status:
        parts.append(status)
    return " · ".join(parts)


def _message_body(activity: dict[str, Any]) -> str:
    subject = _clean_subject(activity.get("subject"))
    body = (activity.get("body") or "").strip()
    if body and body != subject:
        return f"{subject}\n\n{body}" if subject else body
    return subject


def _attachments_for_activity(activity: dict[str, Any]) -> list[dict[str, Any]]:
    meta = _meta_dict(activity.get("meta"))
    payload: dict[str, Any] = {
        "type": "call_log",
        "activityId": str(activity["id"]),
        "activitySubject": _clean_subject(activity.get("subject")),
        "activityStatus": activity.get("status") or "",
    }
    for key in ("durationMinutes", "duration", "outcome", "callMode", "direction"):
        if meta.get(key) is not None:
            payload[key] = meta.get(key)
    return [payload]


def _activity_timestamp(activity: dict[str, Any]) -> datetime:
    for key in ("completed_at", "updated_at", "created_at"):
        raw = activity.get(key)
        if raw:
            if isinstance(raw, datetime):
                return raw if raw.tzinfo else raw.replace(tzinfo=timezone.utc)
            try:
                return datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
            except ValueError:
                continue
    return _utc_now()


def _fetch_activity(cursor, organization_id: str, activity_id: str) -> dict | None:
    cursor.execute(
        """
        select
          a.*,
          trim(concat_ws(' ', c.first_name, c.last_name)) as contact_full_name,
          c.email as contact_email_resolved,
          c.phone as contact_phone_resolved,
          c.title as contact_job_title,
          co.name as company_name_resolved,
          d.name as deal_name_resolved,
          u.name as user_full_name,
          u.email as user_email_resolved
        from activities a
        left join contacts c on c.id = a.contact_id and c.organization_id = a.organization_id
        left join companies co on co.id = a.company_id and co.organization_id = a.organization_id
        left join deals d on d.id = a.deal_id and d.organization_id = a.organization_id
        left join users u on u.id = coalesce(a.assignee_id, a.user_id)
        where a.organization_id = %s and a.id = %s
        limit 1
        """,
        (organization_id, activity_id),
    )
    return serialize_row(cursor.fetchone())


def upsert_call_log_from_activity(
    cursor,
    *,
    organization_id: str,
    activity: dict[str, Any],
) -> str | None:
    if not call_activity_qualifies(activity):
        return None

    activity_id = str(activity["id"])
    cursor.execute(
        """
        select id
        from comm_conversations
        where organization_id = %s and source_activity_id = %s
        limit 1
        """,
        (organization_id, activity_id),
    )
    existing = serialize_row(cursor.fetchone())

    contact_name = (
        activity.get("contact_full_name")
        or activity.get("contact_name")
        or ""
    )
    contact_email = activity.get("contact_email_resolved") or activity.get("contact_email") or ""
    company_name = activity.get("company_name_resolved") or activity.get("company_name") or ""
    deal_name = activity.get("deal_name_resolved") or activity.get("deal_name") or ""
    phone = activity.get("contact_phone_resolved") or activity.get("phone") or ""
    job_title = activity.get("contact_job_title") or activity.get("job_title") or ""

    assignee_id = activity.get("assignee_id") or activity.get("user_id")
    sender_name = activity.get("user_full_name") or activity.get("user_email_resolved") or "Team member"
    subject = _clean_subject(activity.get("subject"))
    preview = _call_preview(activity)
    when = _activity_timestamp(activity)
    now = _utc_now()
    body_text = _message_body(activity)
    attachments = _attachments_for_activity(activity)

    conv_id = str(existing["id"]) if existing and existing.get("id") else str(uuid4())

    if existing and existing.get("id"):
        cursor.execute(
            """
            update comm_conversations
            set
              channel = 'call',
              subject = %s,
              contact_id = %s,
              company_id = %s,
              deal_id = %s,
              contact_name = %s,
              contact_email = %s,
              company_name = %s,
              deal_name = %s,
              job_title = %s,
              phone = %s,
              assignee_id = %s,
              last_message_preview = %s,
              last_message_at = %s,
              unread_count = 0,
              awaiting_response = false,
              updated_at = %s
            where organization_id = %s and id = %s
            """,
            (
                subject,
                activity.get("contact_id"),
                activity.get("company_id"),
                activity.get("deal_id"),
                contact_name,
                contact_email,
                company_name,
                deal_name,
                job_title,
                phone,
                assignee_id,
                preview,
                when,
                now,
                organization_id,
                conv_id,
            ),
        )
        cursor.execute(
            """
            delete from comm_messages
            where organization_id = %s and conversation_id = %s
            """,
            (organization_id, conv_id),
        )
    else:
        cursor.execute(
            """
            insert into comm_conversations (
              id, organization_id, channel, subject,
              contact_id, company_id, deal_id,
              contact_name, contact_email, company_name, deal_name,
              job_title, phone, assignee_id,
              starred, archived, unread_count, awaiting_response,
              last_message_preview, last_message_at,
              source_activity_id, updated_at
            ) values (
              %s, %s, 'call', %s,
              %s, %s, %s,
              %s, %s, %s, %s,
              %s, %s, %s,
              false, false, 0, false,
              %s, %s,
              %s, %s
            )
            """,
            (
                conv_id,
                organization_id,
                subject,
                activity.get("contact_id"),
                activity.get("company_id"),
                activity.get("deal_id"),
                contact_name,
                contact_email,
                company_name,
                deal_name,
                job_title,
                phone,
                assignee_id,
                preview,
                when,
                activity_id,
                now,
            ),
        )

    msg_id = str(uuid4())
    cursor.execute(
        """
        insert into comm_messages (
          id, organization_id, conversation_id,
          direction, body, channel, status,
          sender_name, sender_email, attachments, created_at
        ) values (%s, %s, %s, %s, %s, 'call', 'logged', %s, %s, %s, %s)
        """,
        (
            msg_id,
            organization_id,
            conv_id,
            "outbound",
            body_text,
            sender_name,
            activity.get("user_email_resolved") or "",
            Jsonb(attachments),
            when,
        ),
    )
    return conv_id


def sync_call_logs_from_activities(cursor, organization_id: str) -> int:
    cursor.execute(
        """
        select
          a.*,
          trim(concat_ws(' ', c.first_name, c.last_name)) as contact_full_name,
          c.email as contact_email_resolved,
          c.phone as contact_phone_resolved,
          c.title as contact_job_title,
          co.name as company_name_resolved,
          d.name as deal_name_resolved,
          u.name as user_full_name,
          u.email as user_email_resolved
        from activities a
        left join contacts c on c.id = a.contact_id and c.organization_id = a.organization_id
        left join companies co on co.id = a.company_id and co.organization_id = a.organization_id
        left join deals d on d.id = a.deal_id and d.organization_id = a.organization_id
        left join users u on u.id = coalesce(a.assignee_id, a.user_id)
        where a.organization_id = %s and a.type = 'call'
        order by coalesce(a.completed_at, a.updated_at, a.created_at) desc
        limit 300
        """,
        (organization_id,),
    )
    rows = serialize_rows(cursor.fetchall())
    synced = 0
    for row in rows:
        if not call_activity_qualifies(row):
            continue
        try:
            if upsert_call_log_from_activity(cursor, organization_id=organization_id, activity=row):
                synced += 1
        except Exception:
            continue
    return synced


def sync_call_log_for_activity_id(*, organization_id: str, activity_id: str) -> None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            activity = _fetch_activity(cursor, organization_id, activity_id)
            if not activity:
                return
            if not call_activity_qualifies(activity):
                return
            upsert_call_log_from_activity(
                cursor, organization_id=organization_id, activity=activity
            )
            connection.commit()
