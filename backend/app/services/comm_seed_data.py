"""Demo communications threads for empty workspaces (inbox seed)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from app.db import serialize_row


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)

OWNER_EMAIL_BY_KEY: dict[str, str] = {
    "alex": "alex.morgan@novacrm.dev",
    "jordan": "jordan.lee@novacrm.dev",
    "sam": "sam.rivera@novacrm.dev",
    "casey": "casey.nguyen@novacrm.dev",
    "riley": "riley.chen@novacrm.dev",
}


def _hours_ago(hours: float):
    return _utc_now() - timedelta(hours=hours)


def _days_ago(days: int, hour: int = 10, minute: int = 0):
    base = _utc_now() - timedelta(days=days)
    return base.replace(hour=hour, minute=minute, second=0, microsecond=0)


def _message(
    *,
    direction: str,
    body: str,
    created_at,
    sender_name: str = "",
    sender_email: str = "",
    channel: str = "email",
    status: str | None = None,
) -> dict[str, Any]:
    if status is None:
        status = "delivered" if direction == "outbound" else "read"
    return {
        "direction": direction,
        "body": body,
        "created_at": created_at,
        "channel": channel,
        "status": status,
        "sender_name": sender_name,
        "sender_email": sender_email,
    }


SEED_CONVERSATION_SPECS: list[dict[str, Any]] = [
    {
        "channel": "email",
        "subject": "Vertex security questionnaire",
        "contact_name": "Maya Chen",
        "contact_email": "maya.chen@vertex.io",
        "company_name": "Vertex Solutions",
        "deal_name": "Vertex Solutions — Enterprise",
        "job_title": "VP Engineering",
        "phone": "+1 (415) 555-0142",
        "owner_key": "alex",
        "starred": True,
        "archived": False,
        "unread_count": 2,
        "awaiting_response": True,
        "last_message_preview": "Can you send the SOC 2 summary before Friday’s review?",
        "last_message_at": _days_ago(0, 9, 42),
        "messages": [
            _message(
                direction="outbound",
                body="Hi Maya — attaching our security pack ahead of procurement review.",
                created_at=_hours_ago(48),
                sender_name="Alex Morgan",
                sender_email="alex.morgan@novacrm.dev",
            ),
            _message(
                direction="inbound",
                body="Thanks Alex. Can you send the SOC 2 summary before Friday’s review?",
                created_at=_hours_ago(2),
                sender_name="Maya Chen",
                sender_email="maya.chen@vertex.io",
            ),
        ],
    },
    {
        "channel": "email",
        "subject": "Northstar proposal adjustments",
        "contact_name": "Jordan Blake",
        "contact_email": "j.blake@northstar.co",
        "company_name": "Northstar Digital",
        "deal_name": None,
        "job_title": "Director of Ops",
        "phone": "+1 (312) 555-0198",
        "owner_key": "jordan",
        "starred": False,
        "archived": False,
        "unread_count": 0,
        "awaiting_response": False,
        "last_message_preview": "Looks good — proceed with the revised tier.",
        "last_message_at": _days_ago(1, 14, 10),
        "messages": [
            _message(
                direction="inbound",
                body="Can we adjust seats to 120 for year one?",
                created_at=_hours_ago(30),
                sender_name="Jordan Blake",
            ),
            _message(
                direction="outbound",
                body="Updated proposal attached with 120 seats.",
                created_at=_hours_ago(28),
                sender_name="Jordan Lee",
                sender_email="jordan.lee@novacrm.dev",
            ),
            _message(
                direction="inbound",
                body="Looks good — proceed with the revised tier.",
                created_at=_hours_ago(26),
                sender_name="Jordan Blake",
            ),
        ],
    },
    {
        "channel": "email",
        "subject": "Orbit Labs demo scheduling",
        "contact_name": "Priya Sharma",
        "contact_email": "priya.nair@infosys.com",
        "company_name": "Infosys",
        "deal_name": "Infosys Digital CRM",
        "owner_key": "sam",
        "starred": True,
        "archived": False,
        "unread_count": 1,
        "awaiting_response": True,
        "last_message_preview": "Can we move the demo to Thursday 3pm IST?",
        "last_message_at": _days_ago(0, 7, 15),
        "messages": [
            _message(
                direction="inbound",
                body="Can we move the demo to Thursday 3pm IST?",
                created_at=_hours_ago(5),
                sender_name="Priya Nair",
                sender_email="priya.nair@infosys.com",
            ),
        ],
    },
    {
        "channel": "email",
        "subject": "Brightline expo follow-up",
        "contact_name": "Maria Garcia",
        "contact_email": "maria.garcia@telefonica.com",
        "company_name": "Telefónica",
        "owner_key": "casey",
        "starred": False,
        "archived": False,
        "unread_count": 0,
        "awaiting_response": False,
        "last_message_preview": "Got it — see you at the booth.",
        "last_message_at": _days_ago(2, 11, 0),
        "messages": [
            _message(
                direction="outbound",
                body="Reminder: expo meetup tomorrow 2pm.",
                created_at=_hours_ago(50),
                sender_name="Casey Nguyen",
                sender_email="casey.nguyen@novacrm.dev",
            ),
            _message(
                direction="inbound",
                body="Got it — see you at the booth.",
                created_at=_hours_ago(48),
                sender_name="Maria Garcia",
            ),
        ],
    },
    {
        "channel": "call",
        "subject": "",
        "contact_name": "Rahul Verma",
        "contact_email": "rahul.verma@hdfcbank.com",
        "company_name": "HDFC Bank",
        "deal_name": "HDFC Procurement Pilot",
        "owner_key": "alex",
        "starred": False,
        "archived": False,
        "unread_count": 0,
        "awaiting_response": False,
        "last_message_preview": "Call completed · 18 min · Discovery",
        "last_message_at": _days_ago(1, 16, 30),
        "messages": [
            _message(
                direction="inbound",
                body="Call logged from activity: discovery call. Outcome — interested in pilot. Follow-up email scheduled.",
                created_at=_hours_ago(40),
                sender_name="Rahul Verma",
                channel="call",
                status="logged",
            ),
        ],
    },
    {
        "channel": "email",
        "subject": "GlobalPay SSO onboarding",
        "contact_name": "James Okonkwo",
        "contact_email": "james.okonkwo@flutterwave.com",
        "company_name": "Flutterwave",
        "deal_name": None,
        "owner_key": None,
        "starred": False,
        "archived": False,
        "unread_count": 3,
        "awaiting_response": True,
        "last_message_preview": "Who is the technical contact for SSO?",
        "last_message_at": _days_ago(0, 8, 5),
        "messages": [
            _message(
                direction="inbound",
                body="Who is the technical contact for SSO?",
                created_at=_hours_ago(6),
                sender_name="James Okonkwo",
            ),
        ],
    },
    {
        "channel": "email",
        "subject": "Stripe partnership — Q3 check-in",
        "contact_name": "Emily Chen",
        "contact_email": "emily.chen@stripe.com",
        "company_name": "Stripe",
        "deal_name": None,
        "owner_key": "riley",
        "starred": False,
        "archived": True,
        "unread_count": 0,
        "awaiting_response": False,
        "last_message_preview": "Thanks — we'll circle back Q3.",
        "last_message_at": _days_ago(14, 10, 0),
        "messages": [
            _message(
                direction="inbound",
                body="Thanks — we'll circle back Q3.",
                created_at=_hours_ago(336),
                sender_name="Emily Chen",
            ),
        ],
    },
]


def _user_ids_by_email(cursor, organization_id: str) -> dict[str, str]:
    cursor.execute(
        """
        select u.id, u.email
        from users u
        join organization_members om on om.user_id = u.id
        where om.organization_id = %s
        """,
        (organization_id,),
    )
    out: dict[str, str] = {}
    for row in cursor.fetchall():
        data = serialize_row(row)
        email = (data.get("email") or "").lower()
        if email:
            out[email] = str(data["id"])
    return out


def _contact_by_email(cursor, organization_id: str, email: str) -> dict | None:
    if not email:
        return None
    cursor.execute(
        """
        select id, company_id, first_name, last_name, email, title, phone
        from contacts
        where organization_id = %s and lower(email) = lower(%s)
        limit 1
        """,
        (organization_id, email),
    )
    row = cursor.fetchone()
    return serialize_row(row) if row else None


def _company_id_by_name(cursor, organization_id: str, name: str | None) -> str | None:
    if not name:
        return None
    cursor.execute(
        """
        select id from companies
        where organization_id = %s and lower(name) = lower(%s)
        limit 1
        """,
        (organization_id, name),
    )
    row = cursor.fetchone()
    if not row:
        return None
    return str(serialize_row(row)["id"])


def _deal_id_by_name(cursor, organization_id: str, name: str | None) -> tuple[str | None, str | None]:
    if not name:
        return None, None
    cursor.execute(
        """
        select id, name from deals
        where organization_id = %s and lower(name) = lower(%s)
        limit 1
        """,
        (organization_id, name),
    )
    row = cursor.fetchone()
    if not row:
        return None, name
    data = serialize_row(row)
    return str(data["id"]), data.get("name") or name


def seed_demo_conversations(cursor, organization_id: str) -> int:
    """Insert demo threads when inbox is empty. Returns number of conversations created."""
    users = _user_ids_by_email(cursor, organization_id)
    created = 0
    now = _utc_now()

    for spec in SEED_CONVERSATION_SPECS:
        conv_id = str(uuid4())
        contact = _contact_by_email(cursor, organization_id, spec.get("contact_email") or "")
        contact_id = str(contact["id"]) if contact else None
        company_id = None
        if contact and contact.get("company_id"):
            company_id = str(contact["company_id"])
        if not company_id:
            company_id = _company_id_by_name(cursor, organization_id, spec.get("company_name"))

        deal_id, deal_name = _deal_id_by_name(
            cursor, organization_id, spec.get("deal_name")
        )
        if not deal_name:
            deal_name = spec.get("deal_name")

        owner_key = spec.get("owner_key")
        assignee_id = None
        if owner_key:
            email = OWNER_EMAIL_BY_KEY.get(owner_key)
            if email:
                assignee_id = users.get(email.lower())

        job_title = spec.get("job_title") or (contact.get("title") if contact else None)
        phone = spec.get("phone") or (contact.get("phone") if contact else None)
        contact_name = spec.get("contact_name") or ""
        if not contact_name and contact:
            contact_name = f"{contact.get('first_name') or ''} {contact.get('last_name') or ''}".strip()

        cursor.execute(
            """
            insert into comm_conversations (
              id, organization_id, channel, subject,
              contact_id, company_id, deal_id,
              contact_name, contact_email, company_name, deal_name,
              job_title, phone, assignee_id,
              starred, archived, unread_count, awaiting_response,
              last_message_preview, last_message_at, created_at, updated_at
            ) values (
              %s, %s, %s, %s,
              %s, %s, %s,
              %s, %s, %s, %s,
              %s, %s, %s,
              %s, %s, %s, %s,
              %s, %s, %s, %s
            )
            """,
            (
                conv_id,
                organization_id,
                spec["channel"],
                spec.get("subject") or "",
                contact_id,
                company_id,
                deal_id,
                contact_name,
                spec.get("contact_email") or "",
                spec.get("company_name") or "",
                deal_name or "",
                job_title,
                phone,
                assignee_id,
                bool(spec.get("starred")),
                bool(spec.get("archived")),
                int(spec.get("unread_count") or 0),
                bool(spec.get("awaiting_response")),
                spec.get("last_message_preview") or "",
                spec.get("last_message_at"),
                now,
                now,
            ),
        )

        for msg in spec.get("messages") or []:
            cursor.execute(
                """
                insert into comm_messages (
                  id, organization_id, conversation_id,
                  direction, body, channel, status,
                  sender_name, sender_email, created_at
                ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    str(uuid4()),
                    organization_id,
                    conv_id,
                    msg["direction"],
                    msg["body"],
                    msg.get("channel") or spec["channel"],
                    msg.get("status") or "sent",
                    msg.get("sender_name") or "",
                    msg.get("sender_email") or "",
                    msg["created_at"],
                ),
            )
        created += 1

    return created
