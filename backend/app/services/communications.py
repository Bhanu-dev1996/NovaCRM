from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status
from psycopg.types.json import Jsonb

from app.db import get_connection, serialize_row, serialize_rows
from app.services.comm_seed_data import seed_demo_conversations
from app.services.email import email_delivery_configured, send_crm_email

DEFAULT_COMM_SETTINGS: dict[str, Any] = {
    "channels": {
        "email": {"status": "not_connected", "label": "Email"},
        "call": {"status": "connected", "label": "Call history (Activities)"},
    },
    "email": {
        "name": "NovaCRM Sales",
        "email": "sales@novacrm.app",
        "replyTo": "sales@novacrm.app",
        "signature": "—\nNovaCRM",
    },
    "notifications": {
        "newMessage": True,
        "unreadAlerts": True,
        "assignedAlerts": True,
    },
    "permissions": {
        "sendEmail": "all_members",
        "accessConversations": "all_members",
        "manageTemplates": "admins",
    },
}


def load_comm_settings(*, organization_id: str) -> dict[str, Any]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "select comm_settings from organizations where id = %s limit 1",
                (organization_id,),
            )
            row = cursor.fetchone()
    raw = (row or {}).get("comm_settings") or {}
    return _merge_settings(raw)


def assert_comm_permission(
    settings: dict[str, Any], role: str, permission_key: str
) -> None:
    level = (settings.get("permissions") or {}).get(
        permission_key, "all_members"
    )
    allowed = _role_allows(role, level)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission for this action",
        )


def _role_allows(role: str, level: str) -> bool:
    if level == "admins":
        return role in {"owner", "admin"}
    if level == "sales_team":
        return role in {"owner", "admin", "member"}
    return True


def _merge_settings(raw: dict | None) -> dict[str, Any]:
    base = {
        "channels": {**DEFAULT_COMM_SETTINGS["channels"]},
        "email": {**DEFAULT_COMM_SETTINGS["email"]},
        "notifications": {**DEFAULT_COMM_SETTINGS["notifications"]},
        "permissions": {**DEFAULT_COMM_SETTINGS["permissions"]},
    }
    if not raw:
        raw = {}
    if raw.get("channels"):
        base["channels"].update(raw["channels"])
    if raw.get("email"):
        base["email"].update(raw["email"])
    if raw.get("notifications"):
        base["notifications"].update(raw["notifications"])
    if raw.get("permissions"):
        base["permissions"].update(raw["permissions"])

    email_status = "connected" if email_delivery_configured() else "not_connected"
    base["channels"]["email"] = {
        **base["channels"].get("email", {}),
        "status": email_status,
        "label": base["channels"].get("email", {}).get("label") or "Email",
    }
    return base


def _message_to_client(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "conversationId": str(row["conversation_id"]),
        "direction": row["direction"],
        "body": row["body"] or "",
        "createdAt": row["created_at"],
        "channel": row.get("channel") or "email",
        "status": row.get("status") or "sent",
        "senderName": row.get("sender_name") or "",
        "senderEmail": row.get("sender_email") or "",
        "attachments": row.get("attachments") or [],
    }


def _conversation_to_client(row: dict, messages: list[dict]) -> dict:
    return {
        "id": str(row["id"]),
        "channel": row.get("channel") or "email",
        "subject": row.get("subject") or "",
        "contactId": str(row["contact_id"]) if row.get("contact_id") else "",
        "contactName": row.get("contact_name") or "",
        "contactEmail": row.get("contact_email") or "",
        "companyId": str(row["company_id"]) if row.get("company_id") else "",
        "companyName": row.get("company_name") or "",
        "dealId": str(row["deal_id"]) if row.get("deal_id") else "",
        "dealName": row.get("deal_name") or "",
        "jobTitle": row.get("job_title") or "",
        "phone": row.get("phone") or "",
        "assigneeId": str(row["assignee_id"]) if row.get("assignee_id") else "",
        "starred": bool(row.get("starred")),
        "archived": bool(row.get("archived")),
        "unreadCount": int(row.get("unread_count") or 0),
        "awaitingResponse": bool(row.get("awaiting_response")),
        "lastMessagePreview": row.get("last_message_preview") or "",
        "lastMessageAt": row.get("last_message_at"),
        "messages": [_message_to_client(m) for m in messages],
    }


def _template_to_client(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "category": row.get("category") or "Follow-up",
        "subject": row.get("subject") or "",
        "body": row.get("body") or "",
        "visibility": row.get("visibility") or "workspace",
        "updatedAt": row.get("updated_at") or row.get("created_at"),
    }


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _seed_default_templates(cursor, organization_id: str) -> None:
    defaults = [
        {
            "name": "Warm introduction",
            "category": "Introduction",
            "subject": "Introduction — {{company.name}} × NovaCRM",
            "body": "Hi {{contact.first_name}},\n\nI’d love to learn how {{company.name}} is handling customer conversations today.\n\nWould you be open to a short call this week?",
        },
        {
            "name": "Post-demo follow-up",
            "category": "Follow-up",
            "subject": "Following up on our demo",
            "body": "Hi {{contact.first_name}},\n\nThanks again for your time on the product demo. Let me know if you have questions.",
        },
    ]
    now = _utc_now()
    for row in defaults:
        cursor.execute(
            """
            insert into comm_templates (
              id, organization_id, name, category, subject, body, visibility, updated_at
            ) values (%s, %s, %s, %s, %s, %s, 'workspace', %s)
            """,
            (str(uuid4()), organization_id, row["name"], row["category"], row["subject"], row["body"], now),
        )


def fetch_conversation(*, organization_id: str, conversation_id: str) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select * from comm_conversations
                where organization_id = %s and id = %s
                limit 1
                """,
                (organization_id, conversation_id),
            )
            conv_row = serialize_row(cursor.fetchone())
            if not conv_row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
                )
            cursor.execute(
                """
                select * from comm_messages
                where organization_id = %s and conversation_id = %s
                  and status is distinct from 'draft'
                order by created_at asc
                """,
                (organization_id, conversation_id),
            )
            messages = serialize_rows(cursor.fetchall())
    return _conversation_to_client(conv_row, messages)


def _log_email_activity(
    *,
    organization_id: str,
    user_id: str | None,
    contact_id: str | None,
    company_id: str | None,
    deal_id: str | None,
    subject: str | None,
    body: str,
) -> None:
    if not contact_id and not company_id and not deal_id:
        return
    from app.services import crud

    try:
        crud.create_row(
            "activities",
            organization_id=organization_id,
            payload={
                "type": "email",
                "subject": subject or "Email",
                "body": body[:2000],
                "contact_id": contact_id,
                "company_id": company_id,
                "deal_id": deal_id,
                "user_id": user_id,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            },
        )
    except Exception:
        pass


def load_workspace_state(*, organization_id: str) -> dict[str, Any]:
    settings = load_comm_settings(organization_id=organization_id)
    with get_connection() as connection:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                select * from comm_conversations
                where organization_id = %s
                order by last_message_at desc nulls last, created_at desc
                limit 500
                """,
                (organization_id,),
            )
            conv_rows = serialize_rows(cursor.fetchall())
            if not conv_rows:
                seed_demo_conversations(cursor, organization_id)
                connection.commit()
                cursor.execute(
                    """
                    select * from comm_conversations
                    where organization_id = %s
                    order by last_message_at desc nulls last, created_at desc
                    limit 500
                    """,
                    (organization_id,),
                )
                conv_rows = serialize_rows(cursor.fetchall())
            conv_ids = [r["id"] for r in conv_rows]
            messages_by_conv: dict[str, list[dict]] = {str(cid): [] for cid in conv_ids}
            if conv_ids:
                cursor.execute(
                    """
                    select * from comm_messages
                    where organization_id = %s and conversation_id = any(%s::uuid[])
                      and status is distinct from 'draft'
                    order by created_at asc
                    """,
                    (organization_id, conv_ids),
                )
                for msg in serialize_rows(cursor.fetchall()):
                    cid = str(msg["conversation_id"])
                    messages_by_conv.setdefault(cid, []).append(msg)

            conversations = [
                _conversation_to_client(row, messages_by_conv.get(str(row["id"]), []))
                for row in conv_rows
            ]

            cursor.execute(
                """
                select * from comm_templates
                where organization_id = %s
                order by updated_at desc
                limit 200
                """,
                (organization_id,),
            )
            template_rows = serialize_rows(cursor.fetchall())
            if not template_rows:
                _seed_default_templates(cursor, organization_id)
                connection.commit()
                cursor.execute(
                    """
                    select * from comm_templates
                    where organization_id = %s
                    order by updated_at desc
                    limit 200
                    """,
                    (organization_id,),
                )
                template_rows = serialize_rows(cursor.fetchall())
            templates = [_template_to_client(r) for r in template_rows]

            cursor.execute(
                """
                select count(*)::int as count from comm_messages
                where organization_id = %s
                  and direction = 'outbound'
                  and created_at::date = %s
                """,
                (organization_id, date.today()),
            )
            sent_row = cursor.fetchone() or {}
            sent_today = int(sent_row.get("count") or 0)

    return {
        "conversations": conversations,
        "templates": templates,
        "settings": settings,
        "sentTodayCount": sent_today,
        "sentTodayDate": date.today().isoformat(),
    }


def save_settings(*, organization_id: str, patch: dict[str, Any]) -> dict[str, Any]:
    current = load_workspace_state(organization_id=organization_id)["settings"]
    merged = _merge_settings({**current, **patch})
    if patch.get("channels"):
        merged["channels"] = {**current.get("channels", {}), **patch["channels"]}
    if patch.get("email"):
        merged["email"] = {**current.get("email", {}), **patch["email"]}
    if patch.get("notifications"):
        merged["notifications"] = {
            **current.get("notifications", {}),
            **patch["notifications"],
        }
    if patch.get("permissions"):
        merged["permissions"] = {**current.get("permissions", {}), **patch["permissions"]}

    merged = _merge_settings(merged)

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                update organizations
                set comm_settings = %s, updated_at = %s
                where id = %s
                returning comm_settings
                """,
                (Jsonb(merged), _utc_now(), organization_id),
            )
            row = cursor.fetchone()
            connection.commit()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return _merge_settings(row.get("comm_settings") or merged)


def _conv_payload_from_body(body: dict[str, Any]) -> dict[str, Any]:
    return {
        "channel": body.get("channel") or "email",
        "subject": body.get("subject"),
        "contact_id": body.get("contact_id") or body.get("contactId") or None,
        "company_id": body.get("company_id") or body.get("companyId") or None,
        "deal_id": body.get("deal_id") or body.get("dealId") or None,
        "contact_name": body.get("contact_name") or body.get("contactName"),
        "contact_email": body.get("contact_email") or body.get("contactEmail"),
        "company_name": body.get("company_name") or body.get("companyName"),
        "deal_name": body.get("deal_name") or body.get("dealName"),
        "job_title": body.get("job_title") or body.get("jobTitle"),
        "phone": body.get("phone"),
        "assignee_id": body.get("assignee_id") or body.get("assigneeId") or None,
        "starred": bool(body.get("starred", False)),
        "archived": bool(body.get("archived", False)),
        "unread_count": int(body.get("unread_count") or body.get("unreadCount") or 0),
        "awaiting_response": bool(
            body.get("awaiting_response", body.get("awaitingResponse", False))
        ),
        "last_message_preview": body.get("last_message_preview") or body.get("lastMessagePreview"),
        "last_message_at": body.get("last_message_at") or body.get("lastMessageAt"),
    }


def create_conversation(
    *,
    organization_id: str,
    body: dict[str, Any],
    first_message: dict[str, Any] | None = None,
    send_email: bool = False,
) -> dict:
    conv_id = str(uuid4())
    now = _utc_now()
    payload = _conv_payload_from_body(body)
    payload["last_message_at"] = payload.get("last_message_at") or now

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                insert into comm_conversations (
                  id, organization_id, channel, subject,
                  contact_id, company_id, deal_id,
                  contact_name, contact_email, company_name, deal_name,
                  job_title, phone, assignee_id,
                  starred, archived, unread_count, awaiting_response,
                  last_message_preview, last_message_at, updated_at
                ) values (
                  %s, %s, %s, %s,
                  %s, %s, %s,
                  %s, %s, %s, %s,
                  %s, %s, %s,
                  %s, %s, %s, %s,
                  %s, %s, %s
                )
                returning *
                """,
                (
                    conv_id,
                    organization_id,
                    payload["channel"],
                    payload["subject"],
                    payload["contact_id"],
                    payload["company_id"],
                    payload["deal_id"],
                    payload["contact_name"],
                    payload["contact_email"],
                    payload["company_name"],
                    payload["deal_name"],
                    payload["job_title"],
                    payload["phone"],
                    payload["assignee_id"],
                    payload["starred"],
                    payload["archived"],
                    payload["unread_count"],
                    payload["awaiting_response"],
                    payload["last_message_preview"],
                    payload["last_message_at"],
                    now,
                ),
            )
            conv_row = serialize_row(cursor.fetchone())
            if first_message:
                append_message(
                    organization_id=organization_id,
                    conversation_id=conv_id,
                    body=first_message,
                    send_email=send_email,
                    cursor=cursor,
                )
            cursor.execute(
                """
                select * from comm_messages
                where organization_id = %s and conversation_id = %s
                  and status is distinct from 'draft'
                order by created_at asc
                """,
                (organization_id, conv_id),
            )
            messages = serialize_rows(cursor.fetchall())
            connection.commit()

    return _conversation_to_client(conv_row, messages)


def update_conversation(
    *,
    organization_id: str,
    conversation_id: str,
    patch: dict[str, Any],
) -> dict:
    allowed = {
        "channel",
        "subject",
        "contact_id",
        "company_id",
        "deal_id",
        "contact_name",
        "contact_email",
        "company_name",
        "deal_name",
        "job_title",
        "phone",
        "assignee_id",
        "starred",
        "archived",
        "unread_count",
        "awaiting_response",
        "last_message_preview",
        "last_message_at",
    }
    camel_map = {
        "contactId": "contact_id",
        "companyId": "company_id",
        "dealId": "deal_id",
        "contactName": "contact_name",
        "contactEmail": "contact_email",
        "companyName": "company_name",
        "dealName": "deal_name",
        "jobTitle": "job_title",
        "assigneeId": "assignee_id",
        "unreadCount": "unread_count",
        "awaitingResponse": "awaiting_response",
        "lastMessagePreview": "last_message_preview",
        "lastMessageAt": "last_message_at",
    }
    data: dict[str, Any] = {}
    for key, value in patch.items():
        col = camel_map.get(key, key)
        if col in allowed:
            if col == "assignee_id" and value in ("", None):
                data[col] = None
            else:
                data[col] = value

    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
        )

    data["updated_at"] = _utc_now()
    set_parts = [f"{k} = %s" for k in data]
    values = list(data.values()) + [organization_id, conversation_id]

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                update comm_conversations
                set {", ".join(set_parts)}
                where organization_id = %s and id = %s
                returning *
                """,
                values,
            )
            conv_row = serialize_row(cursor.fetchone())
            if not conv_row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
                )
            cursor.execute(
                """
                select * from comm_messages
                where organization_id = %s and conversation_id = %s
                  and status is distinct from 'draft'
                order by created_at asc
                """,
                (organization_id, conversation_id),
            )
            messages = serialize_rows(cursor.fetchall())
            connection.commit()

    return _conversation_to_client(conv_row, messages)


def delete_conversation(*, organization_id: str, conversation_id: str) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                delete from comm_conversations
                where organization_id = %s and id = %s
                returning id
                """,
                (organization_id, conversation_id),
            )
            row = serialize_row(cursor.fetchone())
            connection.commit()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return {"ok": True, "id": str(row["id"])}


def append_message(
    *,
    organization_id: str,
    conversation_id: str,
    body: dict[str, Any],
    send_email: bool = False,
    cursor=None,
) -> dict:
    msg_id = str(uuid4())
    now = _utc_now()
    direction = body.get("direction") or "outbound"
    channel = body.get("channel") or "email"
    text_body = body.get("body") or ""
    status_value = body.get("status") or ("sent" if direction == "outbound" else "read")
    sender_name = body.get("sender_name") or body.get("senderName")
    sender_email = body.get("sender_email") or body.get("senderEmail")
    subject = body.get("subject")

    def _insert(cur) -> dict:
        nonlocal status_value
        if status_value == "draft":
            send_email = False
        if send_email and direction == "outbound" and channel == "email":
            to_email = body.get("to_email") or body.get("toEmail")
            if to_email:
                comm_settings = load_comm_settings(organization_id=organization_id)
                email_cfg = comm_settings.get("email") or {}
                outbound_name = sender_name or email_cfg.get("name")
                reply_to = sender_email or email_cfg.get("replyTo") or email_cfg.get("email")
                signature = (email_cfg.get("signature") or "").strip()
                email_text = text_body
                if signature and signature not in email_text:
                    email_text = f"{email_text.rstrip()}\n\n{signature}"
                try:
                    send_crm_email(
                        to_email=to_email,
                        subject=subject or "Message from NovaCRM",
                        text=email_text,
                        from_name=outbound_name,
                        reply_to=reply_to,
                    )
                    status_value = "delivered"
                except HTTPException:
                    status_value = "queued"

        cur.execute(
            """
            insert into comm_messages (
              id, organization_id, conversation_id,
              direction, body, channel, status,
              sender_name, sender_email, attachments, created_at
            ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            returning *
            """,
            (
                msg_id,
                organization_id,
                conversation_id,
                direction,
                text_body,
                channel,
                status_value,
                sender_name,
                sender_email,
                Jsonb(body.get("attachments") or []),
                now,
            ),
        )
        msg_row = serialize_row(cur.fetchone())

        if status_value == "draft":
            return msg_row

        preview = text_body[:120]
        awaiting = direction == "inbound"
        unread_delta = 1 if direction == "inbound" else 0

        cur.execute(
            """
            update comm_conversations
            set
              last_message_preview = %s,
              last_message_at = %s,
              awaiting_response = %s,
              unread_count = case when %s > 0 then unread_count + 1 else 0 end,
              updated_at = %s
            where organization_id = %s and id = %s
            """,
            (preview, now, awaiting, unread_delta, now, organization_id, conversation_id),
        )
        return msg_row

    if cursor is not None:
        return _insert(cursor)

    with get_connection() as connection:
        with connection.cursor() as cur:
            msg_row = _insert(cur)
            connection.commit()
    return msg_row


def create_message(
    *,
    organization_id: str,
    conversation_id: str,
    body: dict[str, Any],
    send_email: bool = False,
    user_id: str | None = None,
) -> dict[str, Any]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select * from comm_conversations
                where organization_id = %s and id = %s
                limit 1
                """,
                (organization_id, conversation_id),
            )
            conv_row = serialize_row(cursor.fetchone())
            if not conv_row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
                )
            msg_row = append_message(
                organization_id=organization_id,
                conversation_id=conversation_id,
                body=body,
                send_email=send_email,
                cursor=cursor,
            )
            connection.commit()

    msg = _message_to_client(msg_row)
    if (
        send_email
        and msg.get("status") == "delivered"
        and msg.get("direction") == "outbound"
    ):
        _log_email_activity(
            organization_id=organization_id,
            user_id=user_id,
            contact_id=conv_row.get("contact_id"),
            company_id=conv_row.get("company_id"),
            deal_id=conv_row.get("deal_id"),
            subject=body.get("subject") or conv_row.get("subject"),
            body=msg.get("body") or "",
        )

    conversation = fetch_conversation(
        organization_id=organization_id, conversation_id=conversation_id
    )
    return {"message": msg, "conversation": conversation}


def upsert_template(
    *,
    organization_id: str,
    template_id: str | None,
    body: dict[str, Any],
) -> dict:
    now = _utc_now()
    row_id = template_id or str(uuid4())
    with get_connection() as connection:
        with connection.cursor() as cursor:
            if template_id:
                cursor.execute(
                    """
                    update comm_templates
                    set name = %s, category = %s, subject = %s, body = %s,
                        visibility = %s, updated_at = %s
                    where organization_id = %s and id = %s
                    returning *
                    """,
                    (
                        body["name"],
                        body.get("category") or "Follow-up",
                        body["subject"],
                        body["body"],
                        body.get("visibility") or "workspace",
                        now,
                        organization_id,
                        template_id,
                    ),
                )
            else:
                cursor.execute(
                    """
                    insert into comm_templates (
                      id, organization_id, name, category, subject, body, visibility, updated_at
                    ) values (%s, %s, %s, %s, %s, %s, %s, %s)
                    returning *
                    """,
                    (
                        row_id,
                        organization_id,
                        body["name"],
                        body.get("category") or "Follow-up",
                        body["subject"],
                        body["body"],
                        body.get("visibility") or "workspace",
                        now,
                    ),
                )
            row = serialize_row(cursor.fetchone())
            connection.commit()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return _template_to_client(row)


def delete_template(*, organization_id: str, template_id: str) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                delete from comm_templates
                where organization_id = %s and id = %s
                returning id
                """,
                (organization_id, template_id),
            )
            row = serialize_row(cursor.fetchone())
            connection.commit()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return {"ok": True, "id": str(row["id"])}


def inbox_unread_total(*, organization_id: str) -> int:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select coalesce(sum(unread_count), 0)::int as total
                from comm_conversations
                where organization_id = %s
                  and coalesce(archived, false) = false
                """,
                (organization_id,),
            )
            row = serialize_row(cursor.fetchone())
    return int((row or {}).get("total") or 0)
