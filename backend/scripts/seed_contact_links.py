"""Link demo contacts to leads and seed deals (idempotent). Run after seed_contacts + seed_leads."""

from __future__ import annotations

from pathlib import Path
import json
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
import psycopg

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

load_dotenv(ROOT / ".env")

PRIMARY_ORG_ID = "a8414d8d-a9fd-4880-a557-01c9ef16046c"

# Extra lead ↔ contact associations (emails already match for maya + aisha)
CONTACT_LEAD_PAIRS = [
    ("priya.nair@infosys.com", "priya@orbitlabs.ai"),
    ("emily.chen@stripe.com", "elena.v@globalpay.com"),
    ("rahul.verma@hdfcbank.com", "j.blake@northstar.co"),
    ("sophie.martin@salesforce.com", "noah@brightline.media"),
    ("arjun.mehta@tatasteel.com", "dortiz@acmecorp.com"),
    ("olivia.brown@deloitte.com", "c.patel@fintecharch.com"),
    ("david.kim@samsung.com", "sofia@nexusretail.com"),
    ("maria.garcia@telefonica.com", "mwebb@biohealth.com"),
]

# Converted lead (by email) → contact email
CONVERTED_LEAD_CONTACT = [
    ("aisha@cloudscale.io", "aisha@cloudscale.io"),
]

SEED_DEALS = [
    {
        "name": "Vertex Solutions — Enterprise",
        "contact_email": "maya.chen@vertex.io",
        "amount": 48000,
    },
    {
        "name": "CloudScale Expansion",
        "contact_email": "aisha@cloudscale.io",
        "amount": 125000,
    },
    {
        "name": "Infosys Digital CRM",
        "contact_email": "priya.nair@infosys.com",
        "amount": 92000,
    },
    {
        "name": "GlobalPay Partnership",
        "contact_email": "emily.chen@stripe.com",
        "amount": 67000,
    },
    {
        "name": "HDFC Procurement Pilot",
        "contact_email": "rahul.verma@hdfcbank.com",
        "amount": 54000,
    },
    {
        "name": "Salesforce Alliance Package",
        "contact_email": "sophie.martin@salesforce.com",
        "amount": 38000,
    },
    {
        "name": "Tata Steel — CRM Pilot",
        "contact_email": "arjun.mehta@tatasteel.com",
        "amount": 72000,
    },
    {
        "name": "Deloitte Advisory — Referral",
        "contact_email": "olivia.brown@deloitte.com",
        "amount": 45000,
    },
    {
        "name": "Telefónica Madrid Hub",
        "contact_email": "maria.garcia@telefonica.com",
        "amount": 103000,
    },
    {
        "name": "Samsung Enablement Rollout",
        "contact_email": "david.kim@samsung.com",
        "amount": 88000,
    },
]


def _row_id(conn, query: str, params: tuple) -> str | None:
    row = conn.execute(query, params).fetchone()
    return str(row[0]) if row else None


def _merge_contact_ids(related: dict | None, contact_id: str) -> dict:
    payload = dict(related or {})
    key = "contact_ids"
    existing = [str(x) for x in payload.get(key) or []]
    if contact_id not in existing:
        existing.append(contact_id)
    payload[key] = existing
    return payload


def main() -> None:
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL is missing in backend/.env", file=sys.stderr)
        sys.exit(1)

    now = datetime.now(timezone.utc)

    with psycopg.connect(url) as conn:
        org = conn.execute(
            "select id, name from organizations where id = %s",
            (PRIMARY_ORG_ID,),
        ).fetchone()
        if not org:
            print("Primary organization not found. Run seed_organization.py first.")
            sys.exit(1)

        stage_id = _row_id(
            conn,
            """
            select id from pipeline_stages
            where organization_id = %s
            order by position asc
            limit 1
            """,
            (PRIMARY_ORG_ID,),
        )

        linked_leads = 0
        for contact_email, lead_email in CONTACT_LEAD_PAIRS:
            contact_id = _row_id(
                conn,
                """
                select id from contacts
                where organization_id = %s and lower(email) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, contact_email),
            )
            lead_row = conn.execute(
                """
                select id, related from leads
                where organization_id = %s and lower(email) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, lead_email),
            ).fetchone()
            if not contact_id or not lead_row:
                continue
            lead_id, related = lead_row
            merged = _merge_contact_ids(related, contact_id)
            conn.execute(
                """
                update leads
                set related = %s::jsonb, updated_at = %s
                where id = %s
                """,
                (json.dumps(merged), now, lead_id),
            )
            linked_leads += 1

        converted = 0
        for lead_email, contact_email in CONVERTED_LEAD_CONTACT:
            contact_id = _row_id(
                conn,
                """
                select id from contacts
                where organization_id = %s and lower(email) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, contact_email),
            )
            lead_id = _row_id(
                conn,
                """
                select id from leads
                where organization_id = %s and lower(email) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, lead_email),
            )
            if not contact_id or not lead_id:
                continue
            conn.execute(
                """
                update leads
                set converted_contact_id = %s,
                    status = 'Converted',
                    updated_at = %s
                where id = %s
                """,
                (contact_id, now, lead_id),
            )
            converted += 1

        deals_created = 0
        for deal in SEED_DEALS:
            exists = conn.execute(
                """
                select id from deals
                where organization_id = %s and lower(name) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, deal["name"]),
            ).fetchone()
            if exists:
                continue

            contact_id = _row_id(
                conn,
                """
                select id, company_id, owner_id from contacts
                where organization_id = %s and lower(email) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, deal["contact_email"]),
            )
            if not contact_id:
                continue
            contact_row = conn.execute(
                """
                select id, company_id, owner_id from contacts
                where id = %s
                """,
                (contact_id,),
            ).fetchone()
            company_id = contact_row[1]
            owner_id = contact_row[2]

            deal_id = conn.execute(
                """
                insert into deals (
                  organization_id,
                  company_id,
                  contact_id,
                  stage_id,
                  owner_id,
                  name,
                  amount,
                  currency,
                  status,
                  created_at,
                  updated_at
                ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                returning id
                """,
                (
                    PRIMARY_ORG_ID,
                    company_id,
                    contact_id,
                    stage_id,
                    owner_id,
                    deal["name"],
                    deal["amount"],
                    "USD",
                    "open",
                    now,
                    now,
                ),
            ).fetchone()[0]
            deals_created += 1

            conn.execute(
                """
                update leads
                set converted_deal_id = %s, updated_at = %s
                where organization_id = %s
                  and lower(email) = lower(%s)
                  and converted_deal_id is null
                """,
                (
                    deal_id,
                    now,
                    PRIMARY_ORG_ID,
                    deal["contact_email"],
                ),
            )

        conn.commit()
        print(
            f"Contact links: {linked_leads} lead related updates, "
            f"{converted} converted, {deals_created} deals created ({org[1]})"
        )


if __name__ == "__main__":
    main()
