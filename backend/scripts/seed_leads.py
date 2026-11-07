"""Seed demo leads for the primary workspace when the leads table is empty."""

from pathlib import Path
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
import psycopg

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

load_dotenv(ROOT / ".env")

PRIMARY_ORG_ID = "a8414d8d-a9fd-4880-a557-01c9ef16046c"

OWNER_EMAIL_BY_KEY = {
    "alex": "alex.morgan@novacrm.dev",
    "jordan": "jordan.lee@novacrm.dev",
    "sam": "sam.rivera@novacrm.dev",
    "casey": "casey.nguyen@novacrm.dev",
    "riley": "riley.chen@novacrm.dev",
}

SEED_LEADS = [
    {
        "first_name": "Maya",
        "last_name": "Chen",
        "email": "maya.chen@vertex.io",
        "phone": "+1 (415) 555-0142",
        "company_name": "Vertex Solutions",
        "title": "VP of Growth",
        "source": "Website",
        "industry": "SaaS",
        "score": 92,
        "status": "Qualified",
        "owner_key": "alex",
        "created_at": "2026-09-08T10:00:00+00:00",
        "last_contacted_at": "2026-10-24T15:00:00+00:00",
        "notes": "Requested enterprise pricing and SSO options.",
    },
    {
        "first_name": "Jordan",
        "last_name": "Blake",
        "email": "j.blake@northstar.co",
        "phone": "+1 (646) 555-0198",
        "company_name": "Northstar Ltd",
        "title": "Head of Sales Ops",
        "source": "Referral",
        "industry": "FinTech",
        "score": 88,
        "status": "Contacted",
        "owner_key": "jordan",
        "created_at": "2026-09-10T10:00:00+00:00",
        "last_contacted_at": "2026-10-22T16:00:00+00:00",
        "notes": "Introduced by Marcus Vance. Interested in pipeline analytics.",
    },
    {
        "first_name": "Priya",
        "last_name": "Nair",
        "email": "priya@orbitlabs.ai",
        "phone": "+1 (312) 555-0177",
        "company_name": "Orbit Labs",
        "title": "Founder",
        "source": "LinkedIn",
        "industry": "SaaS",
        "score": 76,
        "status": "Nurturing",
        "owner_key": "sam",
        "created_at": "2026-09-12T10:00:00+00:00",
        "last_contacted_at": "2026-10-18T14:00:00+00:00",
        "notes": "Evaluating Q1 budget approval.",
    },
    {
        "first_name": "Daniel",
        "last_name": "Ortiz",
        "email": "dortiz@acmecorp.com",
        "phone": "+1 (212) 555-0114",
        "company_name": "Acme Corp",
        "title": "Revenue Operations Manager",
        "source": "Campaign",
        "industry": "Manufacturing",
        "score": 64,
        "status": "New",
        "owner_key": "casey",
        "created_at": "2026-10-26T10:00:00+00:00",
        "last_contacted_at": None,
        "notes": "",
    },
    {
        "first_name": "Elena",
        "last_name": "Vasquez",
        "email": "elena.v@globalpay.com",
        "phone": "+1 (305) 555-0160",
        "company_name": "GlobalPay Inc",
        "title": "Director of Partnerships",
        "source": "Website",
        "industry": "FinTech",
        "score": 81,
        "status": "Qualified",
        "owner_key": "riley",
        "created_at": "2026-09-14T10:00:00+00:00",
        "last_contacted_at": "2026-10-21T18:00:00+00:00",
        "notes": "Security review scheduled with architecture team.",
    },
    {
        "first_name": "Noah",
        "last_name": "Kim",
        "email": "noah@brightline.media",
        "phone": "+1 (503) 555-0133",
        "company_name": "Brightline Media",
        "title": "COO",
        "source": "Manual",
        "industry": "Media",
        "score": 58,
        "status": "Contacted",
        "owner_key": "alex",
        "created_at": "2026-09-05T10:00:00+00:00",
        "last_contacted_at": "2026-10-15T17:00:00+00:00",
        "notes": "Asked for case studies in media vertical.",
    },
    {
        "first_name": "Aisha",
        "last_name": "Rahman",
        "email": "aisha@cloudscale.io",
        "phone": "+1 (737) 555-0188",
        "company_name": "CloudScale Systems",
        "title": "Chief Revenue Officer",
        "source": "Referral",
        "industry": "SaaS",
        "score": 95,
        "status": "Converted",
        "owner_key": "jordan",
        "created_at": "2026-09-01T10:00:00+00:00",
        "last_contacted_at": "2026-10-20T15:30:00+00:00",
        "notes": "Converted to opportunity — CloudScale Expansion.",
    },
    {
        "first_name": "Marcus",
        "last_name": "Webb",
        "email": "mwebb@biohealth.com",
        "phone": "+1 (617) 555-0129",
        "company_name": "BioHealth Partners",
        "title": "IT Director",
        "source": "LinkedIn",
        "industry": "Healthcare",
        "score": 49,
        "status": "Lost",
        "owner_key": "sam",
        "created_at": "2026-08-15T10:00:00+00:00",
        "last_contacted_at": "2026-09-26T19:00:00+00:00",
        "notes": "Chose incumbent vendor for this cycle.",
    },
    {
        "first_name": "Sofia",
        "last_name": "Almeida",
        "email": "sofia@nexusretail.com",
        "phone": "+1 (206) 555-0155",
        "company_name": "Nexus Retail",
        "title": "Ecommerce Lead",
        "source": "Campaign",
        "industry": "Retail",
        "score": 71,
        "status": "Nurturing",
        "owner_key": "casey",
        "created_at": "2026-09-18T10:00:00+00:00",
        "last_contacted_at": "2026-10-19T16:20:00+00:00",
        "notes": "Waiting on holiday season bandwidth.",
    },
    {
        "first_name": "Chris",
        "last_name": "Patel",
        "email": "c.patel@fintecharch.com",
        "phone": "+1 (408) 555-0107",
        "company_name": "Fintech Architects",
        "title": "Product Lead",
        "source": "Website",
        "industry": "FinTech",
        "score": 84,
        "status": "New",
        "owner_key": "riley",
        "created_at": "2026-10-28T10:00:00+00:00",
        "last_contacted_at": None,
        "notes": "Downloaded ROI calculator from landing page.",
    },
]


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
            "select count(*) from leads where organization_id = %s",
            (PRIMARY_ORG_ID,),
        ).fetchone()[0]

        if existing > 0:
            print(f"Leads already present for {org[1]} ({existing}). Skipping seed.")
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
        inserted = 0
        for lead in SEED_LEADS:
            created_at = lead.get("created_at") or now
            updated_at = lead.get("last_contacted_at") or created_at
            conn.execute(
                """
                insert into leads (
                  organization_id,
                  owner_id,
                  first_name,
                  last_name,
                  email,
                  phone,
                  company_name,
                  title,
                  source,
                  industry,
                  status,
                  score,
                  notes,
                  last_contacted_at,
                  created_at,
                  updated_at
                ) values (
                  %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                """,
                (
                    PRIMARY_ORG_ID,
                    owner_id_by_key[lead["owner_key"]],
                    lead["first_name"],
                    lead["last_name"],
                    lead["email"],
                    lead["phone"],
                    lead["company_name"],
                    lead["title"],
                    lead["source"],
                    lead["industry"],
                    lead["status"],
                    lead["score"],
                    lead["notes"] or None,
                    lead["last_contacted_at"],
                    created_at,
                    updated_at,
                ),
            )
            inserted += 1

        conn.commit()
        print(f"Seeded {inserted} leads into {org[1]} ({PRIMARY_ORG_ID})")


if __name__ == "__main__":
    main()
