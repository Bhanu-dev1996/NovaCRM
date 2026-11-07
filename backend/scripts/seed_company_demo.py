"""Seed tasks, meetings, extra contacts, and lead company links (idempotent)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
import os
import sys

from dotenv import load_dotenv
import psycopg

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.company_seed_data import OWNER_EMAIL_BY_KEY  # noqa: E402

load_dotenv(ROOT / ".env")

PRIMARY_ORG_ID = "a8414d8d-a9fd-4880-a557-01c9ef16046c"

EXTRA_CONTACTS = [
    {
        "first_name": "Leo",
        "last_name": "Nguyen",
        "email": "leo.nguyen@cloudscale.io",
        "phone": "+1 (737) 555-0199",
        "title": "Solutions Architect",
        "company_name": "CloudScale Systems",
        "owner_key": "jordan",
    },
    {
        "first_name": "Hannah",
        "last_name": "Reeves",
        "email": "hannah.reeves@vertex.io",
        "phone": "+1 (415) 555-0171",
        "title": "Director, RevOps",
        "company_name": "Vertex Solutions",
        "owner_key": "alex",
    },
    {
        "first_name": "Vikram",
        "last_name": "Shetty",
        "email": "vikram.shetty@infosys.com",
        "phone": "+91 98765 11112",
        "title": "Program Manager",
        "company_name": "Infosys",
        "owner_key": "sam",
    },
    {
        "first_name": "Lena",
        "last_name": "Fischer",
        "email": "lena.fischer@stripe.com",
        "phone": "+1 (415) 555-0122",
        "title": "Legal Counsel",
        "company_name": "Stripe",
        "owner_key": "jordan",
    },
]


def _company_id(conn, organization_id: str, name: str) -> str | None:
    row = conn.execute(
        """
        select id from companies
        where organization_id = %s and lower(name) = lower(%s)
        limit 1
        """,
        (organization_id, name),
    ).fetchone()
    return str(row[0]) if row else None


def main() -> None:
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL missing", file=sys.stderr)
        sys.exit(1)

    now = datetime.now(timezone.utc)
    tasks_created = 0
    meetings_created = 0
    contacts_created = 0
    leads_updated = 0

    with psycopg.connect(url) as conn:
        org = conn.execute(
            "select id, name from organizations where id = %s",
            (PRIMARY_ORG_ID,),
        ).fetchone()
        if not org:
            print("Organization not found", file=sys.stderr)
            sys.exit(1)

        users = conn.execute(
            """
            select id, email from users
            where lower(email) = any(%s)
            """,
            ([email.lower() for email in OWNER_EMAIL_BY_KEY.values()],),
        ).fetchall()
        user_id_by_email = {email.lower(): user_id for user_id, email in users}
        default_owner = user_id_by_email.get(OWNER_EMAIL_BY_KEY["alex"].lower())
        owner_id_by_key = {
            key: user_id_by_email.get(email.lower())
            for key, email in OWNER_EMAIL_BY_KEY.items()
        }

        for row in EXTRA_CONTACTS:
            exists = conn.execute(
                """
                select id from contacts
                where organization_id = %s and lower(email) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, row["email"]),
            ).fetchone()
            if exists:
                continue
            owner_id = owner_id_by_key.get(row["owner_key"]) or default_owner
            company_id = _company_id(conn, PRIMARY_ORG_ID, row["company_name"])
            conn.execute(
                """
                insert into contacts (
                  organization_id, company_id, owner_id,
                  first_name, last_name, email, phone, title,
                  created_at, updated_at
                ) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    PRIMARY_ORG_ID,
                    company_id,
                    owner_id,
                    row["first_name"],
                    row["last_name"],
                    row["email"],
                    row["phone"],
                    row["title"],
                    now,
                    now,
                ),
            )
            contacts_created += 1

        cur = conn.cursor()
        cur.execute(
            """
            update leads l
            set company_id = c.id, updated_at = %s
            from companies c
            where l.organization_id = %s
              and c.organization_id = %s
              and l.company_id is null
              and lower(trim(l.company_name)) = lower(trim(c.name))
            """,
            (now, PRIMARY_ORG_ID, PRIMARY_ORG_ID),
        )
        leads_updated = cur.rowcount

        companies = conn.execute(
            """
            select c.id, c.name, ct.id as contact_id
            from companies c
            left join lateral (
              select id from contacts
              where organization_id = c.organization_id and company_id = c.id
              order by created_at asc
              limit 1
            ) ct on true
            where c.organization_id = %s
            """,
            (PRIMARY_ORG_ID,),
        ).fetchall()

        for company_id, company_name, contact_id in companies:
            if not company_name:
                continue
            task_title = f"{company_name} — account map refresh"
            task_exists = conn.execute(
                """
                select id from tasks
                where organization_id = %s and lower(title) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, task_title),
            ).fetchone()
            if not task_exists:
                conn.execute(
                    """
                    insert into tasks (
                      organization_id, contact_id, assignee_id,
                      title, description, status, priority, due_at,
                      created_at, updated_at
                    ) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    """,
                    (
                        PRIMARY_ORG_ID,
                        contact_id,
                        default_owner,
                        task_title,
                        f"Update stakeholders and champions for {company_name}.",
                        "todo",
                        "high",
                        now + timedelta(days=4),
                        now,
                        now,
                    ),
                )
                tasks_created += 1

            meeting_subject = f"Executive check-in — {company_name}"
            meeting_exists = conn.execute(
                """
                select id from activities
                where organization_id = %s
                  and type = 'meeting'
                  and lower(subject) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, meeting_subject),
            ).fetchone()
            if not meeting_exists:
                conn.execute(
                    """
                    insert into activities (
                      organization_id, company_id, contact_id, user_id,
                      type, subject, body, due_at, created_at, updated_at
                    ) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    """,
                    (
                        PRIMARY_ORG_ID,
                        company_id,
                        contact_id,
                        default_owner,
                        "meeting",
                        meeting_subject,
                        f"Quarterly alignment with {company_name} leadership.",
                        now + timedelta(days=6),
                        now,
                        now,
                    ),
                )
                meetings_created += 1

        conn.commit()
        print(
            f"Company demo: +{contacts_created} contacts, +{tasks_created} tasks, "
            f"+{meetings_created} meetings, {leads_updated} leads linked ({org[1]})"
        )


if __name__ == "__main__":
    main()
