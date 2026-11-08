"""Seed pipeline stages and demo deals for the primary workspace (idempotent)."""

from __future__ import annotations

from datetime import date, datetime, timezone
from pathlib import Path
import os
import sys

from dotenv import load_dotenv
import psycopg

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

load_dotenv(ROOT / ".env")

PRIMARY_ORG_ID = "a8414d8d-a9fd-4880-a557-01c9ef16046c"

CANONICAL_STAGES = [
    ("New", 1, 10, False, False),
    ("Qualified", 2, 25, False, False),
    ("Proposal", 3, 50, False, False),
    ("Negotiation", 4, 75, False, False),
    ("Closed Won", 5, 100, True, False),
    ("Closed Lost", 6, 0, False, True),
]

STAGE_ALIASES: dict[str, list[str]] = {
    "New": ["New", "Qualify"],
    "Qualified": ["Qualified", "Qualify"],
    "Proposal": ["Proposal"],
    "Negotiation": ["Negotiation", "Negotiate"],
    "Closed Won": ["Closed Won", "Closed-Won"],
    "Closed Lost": ["Closed Lost", "Closed-Lost"],
}

# stage: one of CANONICAL_STAGES name keys; status: open | won | lost
DEAL_SPECS = [
    {
        "name": "Vertex Solutions — Enterprise",
        "contact_email": "maya.chen@vertex.io",
        "amount": 1850000,
        "currency": "INR",
        "stage": "Proposal",
        "status": "open",
        "expected_close_date": date(2026, 4, 15),
        "owner_email": "alex.morgan@novacrm.dev",
    },
    {
        "name": "CloudScale Expansion",
        "contact_email": "aisha@cloudscale.io",
        "amount": 3200000,
        "currency": "INR",
        "stage": "Negotiation",
        "status": "open",
        "expected_close_date": date(2026, 3, 28),
        "owner_email": "jordan.lee@novacrm.dev",
    },
    {
        "name": "Infosys Digital CRM",
        "contact_email": "priya.nair@infosys.com",
        "amount": 920000,
        "currency": "INR",
        "stage": "Qualified",
        "status": "open",
        "expected_close_date": date(2026, 5, 10),
        "owner_email": "sam.rivera@novacrm.dev",
    },
    {
        "name": "GlobalPay Partnership",
        "contact_email": "emily.chen@stripe.com",
        "amount": 670000,
        "currency": "INR",
        "stage": "New",
        "status": "open",
        "expected_close_date": date(2026, 6, 1),
        "owner_email": "jordan.lee@novacrm.dev",
    },
    {
        "name": "HDFC Procurement Pilot",
        "contact_email": "rahul.verma@hdfcbank.com",
        "amount": 540000,
        "currency": "INR",
        "stage": "Proposal",
        "status": "open",
        "expected_close_date": date(2026, 4, 2),
        "owner_email": "alex.morgan@novacrm.dev",
    },
    {
        "name": "Salesforce Alliance Package",
        "contact_email": "sophie.martin@salesforce.com",
        "amount": 380000,
        "currency": "INR",
        "stage": "New",
        "status": "open",
        "expected_close_date": date(2026, 7, 12),
        "owner_email": "riley.chen@novacrm.dev",
    },
    {
        "name": "Tata Steel — CRM Pilot",
        "contact_email": "arjun.mehta@tatasteel.com",
        "amount": 720000,
        "currency": "INR",
        "stage": "Qualified",
        "status": "open",
        "expected_close_date": date(2026, 5, 20),
        "owner_email": "alex.morgan@novacrm.dev",
    },
    {
        "name": "Deloitte Advisory — Referral",
        "contact_email": "olivia.brown@deloitte.com",
        "amount": 450000,
        "currency": "INR",
        "stage": "Negotiation",
        "status": "open",
        "expected_close_date": date(2026, 3, 15),
        "owner_email": "sam.rivera@novacrm.dev",
    },
    {
        "name": "Telefónica Madrid Hub",
        "contact_email": "maria.garcia@telefonica.com",
        "amount": 1030000,
        "currency": "INR",
        "stage": "Proposal",
        "status": "open",
        "expected_close_date": date(2026, 4, 30),
        "owner_email": "casey.nguyen@novacrm.dev",
    },
    {
        "name": "Samsung Enablement Rollout",
        "contact_email": "david.kim@samsung.com",
        "amount": 880000,
        "currency": "INR",
        "stage": "Qualified",
        "status": "open",
        "expected_close_date": date(2026, 5, 5),
        "owner_email": "riley.chen@novacrm.dev",
    },
    {
        "name": "Flutterwave Revenue Ops",
        "contact_email": "james.okonkwo@flutterwave.com",
        "amount": 610000,
        "currency": "INR",
        "stage": "New",
        "status": "open",
        "expected_close_date": date(2026, 8, 1),
        "owner_email": "casey.nguyen@novacrm.dev",
    },
    {
        "name": "Sony Corporate — Analytics",
        "contact_email": "kenji.tanaka@sony.com",
        "amount": 1250000,
        "currency": "INR",
        "stage": "Negotiation",
        "status": "open",
        "expected_close_date": date(2026, 3, 22),
        "owner_email": "jordan.lee@novacrm.dev",
    },
    {
        "name": "Northstar SaaS Bundle",
        "contact_email": "mwebb@biohealth.com",
        "amount": 295000,
        "currency": "INR",
        "stage": "New",
        "status": "open",
        "expected_close_date": date(2026, 9, 10),
        "owner_email": "jamie.patel@novacrm.dev",
    },
    {
        "name": "BioHealth Renewal",
        "contact_email": "mwebb@biohealth.com",
        "amount": 410000,
        "currency": "INR",
        "stage": "Qualified",
        "status": "open",
        "expected_close_date": date(2026, 4, 8),
        "owner_email": "jamie.patel@novacrm.dev",
    },
    {
        "name": "Acme Corp Platform Upgrade",
        "contact_email": "dortiz@acmecorp.com",
        "amount": 1560000,
        "currency": "INR",
        "stage": "Proposal",
        "status": "open",
        "expected_close_date": date(2026, 4, 18),
        "owner_email": "alex.morgan@novacrm.dev",
    },
    {
        "name": "Brightline Media — Annual",
        "contact_email": "noah@brightline.media",
        "amount": 275000,
        "currency": "INR",
        "stage": "Closed Won",
        "status": "won",
        "expected_close_date": date(2026, 1, 20),
        "owner_email": "dakota.price@novacrm.dev",
    },
    {
        "name": "FinTech Arch Implementation",
        "contact_email": "c.patel@fintecharch.com",
        "amount": 890000,
        "currency": "INR",
        "stage": "Closed Won",
        "status": "won",
        "expected_close_date": date(2026, 2, 5),
        "owner_email": "sam.rivera@novacrm.dev",
    },
    {
        "name": "Nexus Retail POS Rollout",
        "contact_email": "sofia@nexusretail.com",
        "amount": 520000,
        "currency": "INR",
        "stage": "Closed Won",
        "status": "won",
        "expected_close_date": date(2025, 12, 15),
        "owner_email": "riley.chen@novacrm.dev",
    },
    {
        "name": "Orbit Labs AI Suite",
        "contact_email": "priya@orbitlabs.ai",
        "amount": 340000,
        "currency": "INR",
        "stage": "Closed Lost",
        "status": "lost",
        "expected_close_date": date(2026, 1, 10),
        "owner_email": "casey.nguyen@novacrm.dev",
    },
    {
        "name": "Northstar Co — Migration",
        "contact_email": "j.blake@northstar.co",
        "amount": 480000,
        "currency": "INR",
        "stage": "Closed Lost",
        "status": "lost",
        "expected_close_date": date(2025, 11, 30),
        "owner_email": "jordan.lee@novacrm.dev",
    },
]


def _ensure_default_pipeline(conn, organization_id: str) -> str:
    row = conn.execute(
        """
        select id from pipelines
        where organization_id = %s and is_default = true
        limit 1
        """,
        (organization_id,),
    ).fetchone()
    if row:
        return str(row[0])
    row = conn.execute(
        """
        insert into pipelines (organization_id, name, is_default, updated_at)
        values (%s, %s, true, now())
        returning id
        """,
        (organization_id, "Sales Pipeline"),
    ).fetchone()
    return str(row[0])


def _ensure_stages(conn, organization_id: str) -> None:
    now = datetime.now(timezone.utc)
    pipeline_id = _ensure_default_pipeline(conn, organization_id)
    for name, position, probability, is_won, is_lost in CANONICAL_STAGES:
        row = conn.execute(
            """
            select id from pipeline_stages
            where organization_id = %s and lower(name) = lower(%s)
            limit 1
            """,
            (organization_id, name),
        ).fetchone()
        if row:
            conn.execute(
                """
                update pipeline_stages
                set position = %s,
                    pipeline_id = %s,
                    probability = %s,
                    is_won = %s,
                    is_lost = %s,
                    updated_at = %s
                where id = %s
                """,
                (position, pipeline_id, probability, is_won, is_lost, now, row[0]),
            )
            continue
        conn.execute(
            """
            insert into pipeline_stages (
              organization_id, pipeline_id, name, position, probability, is_won, is_lost,
              created_at, updated_at
            )
            values (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                organization_id,
                pipeline_id,
                name,
                position,
                probability,
                is_won,
                is_lost,
                now,
                now,
            ),
        )


def _retire_legacy_stages(conn, organization_id: str) -> int:
    """Move deals off old default stages and remove duplicates when canonical pipeline exists."""
    has_new = conn.execute(
        """
        select id from pipeline_stages
        where organization_id = %s and lower(name) = lower(%s)
        limit 1
        """,
        (organization_id, "New"),
    ).fetchone()
    if not has_new:
        return 0

    retired = 0
    legacy_map = [
        ("Qualify", "New"),
        ("Negotiate", "Negotiation"),
        ("Closed-Won", "Closed Won"),
        ("Closed-Lost", "Closed Lost"),
    ]
    now = datetime.now(timezone.utc)

    for old_name, new_name in legacy_map:
        old_row = conn.execute(
            """
            select id from pipeline_stages
            where organization_id = %s and lower(name) = lower(%s)
            limit 1
            """,
            (organization_id, old_name),
        ).fetchone()
        new_row = conn.execute(
            """
            select id from pipeline_stages
            where organization_id = %s and lower(name) = lower(%s)
            limit 1
            """,
            (organization_id, new_name),
        ).fetchone()
        if not old_row or not new_row or old_row[0] == new_row[0]:
            continue
        conn.execute(
            """
            update deals
            set stage_id = %s, updated_at = %s
            where organization_id = %s and stage_id = %s
            """,
            (new_row[0], now, organization_id, old_row[0]),
        )
        conn.execute(
            "delete from pipeline_stages where id = %s",
            (old_row[0],),
        )
        retired += 1
    return retired


def _stage_id(conn, organization_id: str, canonical: str) -> str | None:
    for name in STAGE_ALIASES.get(canonical, [canonical]):
        row = conn.execute(
            """
            select id from pipeline_stages
            where organization_id = %s and lower(name) = lower(%s)
            limit 1
            """,
            (organization_id, name),
        ).fetchone()
        if row:
            return str(row[0])
    return None


def _contact_row(conn, organization_id: str, email: str):
    return conn.execute(
        """
        select id, company_id, owner_id
        from contacts
        where organization_id = %s and lower(email) = lower(%s)
        limit 1
        """,
        (organization_id, email),
    ).fetchone()


def _resolve_contact(conn, organization_id: str, email: str, now: datetime):
    row = _contact_row(conn, organization_id, email)
    if row:
        return row

    lead = conn.execute(
        """
        select first_name, last_name, email, phone, title,
               company_id, owner_id, company_name
        from leads
        where organization_id = %s and lower(email) = lower(%s)
        limit 1
        """,
        (organization_id, email),
    ).fetchone()
    if not lead:
        return None

    company_id = lead[5]
    if not company_id and lead[7]:
        company_row = conn.execute(
            """
            select id from companies
            where organization_id = %s and lower(name) = lower(%s)
            limit 1
            """,
            (organization_id, lead[7]),
        ).fetchone()
        if company_row:
            company_id = company_row[0]

    owner_id = lead[6] or _user_id(conn, "alex.morgan@novacrm.dev")
    new_id = conn.execute(
        """
        insert into contacts (
          organization_id, company_id, owner_id,
          first_name, last_name, email, phone, title,
          created_at, updated_at
        )
        values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        returning id, company_id, owner_id
        """,
        (
            organization_id,
            company_id,
            owner_id,
            lead[0],
            lead[1],
            lead[2],
            lead[3],
            lead[4],
            now,
            now,
        ),
    ).fetchone()
    return new_id


def _user_id(conn, email: str) -> str | None:
    row = conn.execute(
        "select id from users where lower(email) = lower(%s) limit 1",
        (email,),
    ).fetchone()
    return str(row[0]) if row else None


def main() -> None:
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL is missing in backend/.env", file=sys.stderr)
        sys.exit(1)

    now = datetime.now(timezone.utc)
    created = 0
    updated = 0

    with psycopg.connect(url) as conn:
        org = conn.execute(
            "select id, name from organizations where id = %s",
            (PRIMARY_ORG_ID,),
        ).fetchone()
        if not org:
            print("Primary organization not found. Run seed_organization.py first.")
            sys.exit(1)

        _ensure_stages(conn, PRIMARY_ORG_ID)
        retired = _retire_legacy_stages(conn, PRIMARY_ORG_ID)

        for spec in DEAL_SPECS:
            stage_id = _stage_id(conn, PRIMARY_ORG_ID, spec["stage"])
            if not stage_id:
                print(f"Skipping {spec['name']}: stage {spec['stage']!r} not found")
                continue

            contact = _resolve_contact(conn, PRIMARY_ORG_ID, spec["contact_email"], now)
            if not contact:
                print(f"Skipping {spec['name']}: contact {spec['contact_email']!r} not found")
                continue
            contact_id, company_id, contact_owner = contact

            owner_id = _user_id(conn, spec["owner_email"]) or contact_owner
            if not owner_id:
                owner_id = _user_id(conn, "alex.morgan@novacrm.dev")

            existing = conn.execute(
                """
                select id from deals
                where organization_id = %s and lower(name) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, spec["name"]),
            ).fetchone()

            close = spec.get("expected_close_date")

            if existing:
                conn.execute(
                    """
                    update deals set
                      company_id = %s,
                      contact_id = %s,
                      stage_id = %s,
                      owner_id = %s,
                      amount = %s,
                      currency = %s,
                      status = %s,
                      expected_close_date = %s,
                      updated_at = %s
                    where id = %s
                    """,
                    (
                        company_id,
                        contact_id,
                        stage_id,
                        owner_id,
                        spec["amount"],
                        spec["currency"],
                        spec["status"],
                        close,
                        now,
                        existing[0],
                    ),
                )
                updated += 1
            else:
                conn.execute(
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
                      expected_close_date,
                      created_at,
                      updated_at
                    )
                    values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        PRIMARY_ORG_ID,
                        company_id,
                        contact_id,
                        stage_id,
                        owner_id,
                        spec["name"],
                        spec["amount"],
                        spec["currency"],
                        spec["status"],
                        close,
                        now,
                        now,
                    ),
                )
                created += 1

        conn.commit()
        print(
            f"Deals seed: {created} created, {updated} updated "
            f"({len(DEAL_SPECS)} specs), {retired} legacy stages retired for {org[1]}"
        )


if __name__ == "__main__":
    main()
