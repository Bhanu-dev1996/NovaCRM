"""Seed demo contacts (and companies) for the primary workspace when contacts are empty."""

from pathlib import Path
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
import psycopg

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.company_seed_data import (  # noqa: E402
    OWNER_EMAIL_BY_KEY,
    company_record_for_name,
)

load_dotenv(ROOT / ".env")

PRIMARY_ORG_ID = "a8414d8d-a9fd-4880-a557-01c9ef16046c"

# Aligned with frontend DEMO_CONTACTS enrichments (contacts-data.js)
SEED_CONTACTS = [
    {
        "first_name": "Priya",
        "last_name": "Nair",
        "email": "priya.nair@infosys.com",
        "phone": "+91 98765 43210",
        "title": "Director, Digital Transformation",
        "company_name": "Infosys",
        "owner_key": "sam",
    },
    {
        "first_name": "Arjun",
        "last_name": "Mehta",
        "email": "arjun.mehta@tatasteel.com",
        "phone": "+91 22 6665 1000",
        "title": "Head of Operations",
        "company_name": "Tata Steel",
        "owner_key": "alex",
    },
    {
        "first_name": "Emily",
        "last_name": "Chen",
        "email": "emily.chen@stripe.com",
        "phone": "+1 (415) 555-0101",
        "title": "Partnerships Lead",
        "company_name": "Stripe",
        "owner_key": "jordan",
    },
    {
        "first_name": "James",
        "last_name": "Okonkwo",
        "email": "james.okonkwo@flutterwave.com",
        "phone": "+234 1 888 4940",
        "title": "Revenue Operations Manager",
        "company_name": "Flutterwave",
        "owner_key": "casey",
    },
    {
        "first_name": "Sophie",
        "last_name": "Martin",
        "email": "sophie.martin@salesforce.com",
        "phone": "+1 (415) 901-7000",
        "title": "Alliance Manager",
        "company_name": "Salesforce",
        "owner_key": "riley",
    },
    {
        "first_name": "Rahul",
        "last_name": "Verma",
        "email": "rahul.verma@hdfcbank.com",
        "phone": "+91 1800 202 6161",
        "title": "IT Procurement Lead",
        "company_name": "HDFC Bank",
        "owner_key": "alex",
    },
    {
        "first_name": "Olivia",
        "last_name": "Brown",
        "email": "olivia.brown@deloitte.com",
        "phone": "+1 (212) 492-4000",
        "title": "Customer Advisory Manager",
        "company_name": "Deloitte",
        "owner_key": "sam",
    },
    {
        "first_name": "Kenji",
        "last_name": "Tanaka",
        "email": "kenji.tanaka@sony.com",
        "phone": "+81 3 6748 2111",
        "title": "Corporate Development",
        "company_name": "Sony",
        "owner_key": "jordan",
    },
    {
        "first_name": "Maria",
        "last_name": "Garcia",
        "email": "maria.garcia@telefonica.com",
        "phone": "+34 91 482 87 00",
        "title": "Customer Success Director",
        "company_name": "Telefónica",
        "owner_key": "casey",
    },
    {
        "first_name": "David",
        "last_name": "Kim",
        "email": "david.kim@samsung.com",
        "phone": "+82 2 2255-0114",
        "title": "Sales Enablement Lead",
        "company_name": "Samsung",
        "owner_key": "riley",
    },
    {
        "first_name": "Maya",
        "last_name": "Chen",
        "email": "maya.chen@vertex.io",
        "phone": "+1 (415) 555-0142",
        "title": "VP of Growth",
        "company_name": "Vertex Solutions",
        "owner_key": "alex",
    },
    {
        "first_name": "Aisha",
        "last_name": "Rahman",
        "email": "aisha@cloudscale.io",
        "phone": "+1 (737) 555-0188",
        "title": "Chief Revenue Officer",
        "company_name": "CloudScale Systems",
        "owner_key": "jordan",
    },
]


def _company_id(conn, organization_id: str, name: str, owner_id: str) -> str:
    now = datetime.now(timezone.utc)
    seed = company_record_for_name(name) or {}
    row = conn.execute(
        """
        select id from companies
        where organization_id = %s and lower(name) = lower(%s)
        limit 1
        """,
        (organization_id, name),
    ).fetchone()
    if row:
        conn.execute(
            """
            update companies set
              domain = coalesce(%s, domain),
              website = coalesce(%s, website),
              industry = coalesce(%s, industry),
              size = coalesce(%s, size),
              phone = coalesce(%s, phone),
              owner_id = coalesce(%s, owner_id),
              updated_at = %s
            where id = %s
            """,
            (
                seed.get("domain"),
                seed.get("website"),
                seed.get("industry"),
                seed.get("size"),
                seed.get("phone"),
                owner_id,
                now,
                row[0],
            ),
        )
        return row[0]

    row = conn.execute(
        """
        insert into companies (
          organization_id, name, domain, website, industry, size, phone,
          owner_id, created_at, updated_at
        )
        values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        returning id
        """,
        (
            organization_id,
            name,
            seed.get("domain"),
            seed.get("website"),
            seed.get("industry"),
            seed.get("size"),
            seed.get("phone"),
            owner_id,
            now,
            now,
        ),
    ).fetchone()
    return row[0]


def main() -> None:
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL is missing in backend/.env", file=sys.stderr)
        sys.exit(1)

    with psycopg.connect(url) as conn:
        org = conn.execute(
            "select id, name from organizations where id = %s",
            (PRIMARY_ORG_ID,),
        ).fetchone()
        if not org:
            print(
                f"Primary organization {PRIMARY_ORG_ID} not found. Run seed_organization.py first.",
                file=sys.stderr,
            )
            sys.exit(1)

        existing = conn.execute(
            "select count(*) from contacts where organization_id = %s",
            (PRIMARY_ORG_ID,),
        ).fetchone()[0]

        if existing > 0:
            print(f"Contacts already present for {org[1]} ({existing}). Skipping seed.")
            return

        users = conn.execute(
            """
            select id, email
            from users
            where lower(email) = any(%s)
            """,
            ([email.lower() for email in OWNER_EMAIL_BY_KEY.values()],),
        ).fetchall()
        user_id_by_email = {email.lower(): user_id for user_id, email in users}

        owner_id_by_key = {}
        for key, email in OWNER_EMAIL_BY_KEY.items():
            user_id = user_id_by_email.get(email.lower())
            if not user_id:
                print(f"Missing seed user {email}. Run seed_users.py first.", file=sys.stderr)
                sys.exit(1)
            owner_id_by_key[key] = user_id

        now = datetime.now(timezone.utc)
        companies_created = 0
        company_ids_before = conn.execute(
            "select count(*) from companies where organization_id = %s",
            (PRIMARY_ORG_ID,),
        ).fetchone()[0]

        inserted = 0
        for contact in SEED_CONTACTS:
            owner_id = owner_id_by_key[contact["owner_key"]]
            company_id = _company_id(
                conn,
                PRIMARY_ORG_ID,
                contact["company_name"],
                owner_id,
            )
            conn.execute(
                """
                insert into contacts (
                  organization_id,
                  company_id,
                  owner_id,
                  first_name,
                  last_name,
                  email,
                  phone,
                  title,
                  created_at,
                  updated_at
                ) values (
                  %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                """,
                (
                    PRIMARY_ORG_ID,
                    company_id,
                    owner_id,
                    contact["first_name"],
                    contact["last_name"],
                    contact["email"],
                    contact["phone"],
                    contact["title"],
                    now,
                    now,
                ),
            )
            inserted += 1

        companies_after = conn.execute(
            "select count(*) from companies where organization_id = %s",
            (PRIMARY_ORG_ID,),
        ).fetchone()[0]
        companies_created = companies_after - company_ids_before

        conn.commit()
        print(
            f"Seeded {inserted} contacts and {companies_created} companies into {org[1]} ({PRIMARY_ORG_ID})"
        )


if __name__ == "__main__":
    main()
