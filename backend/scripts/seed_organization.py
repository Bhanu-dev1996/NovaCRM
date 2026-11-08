"""Seed workspaces + members. Keeps the primary org id and adds demo workspaces."""

from pathlib import Path
import os
import sys

from dotenv import load_dotenv
import psycopg

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

load_dotenv(ROOT / ".env")

PRIMARY_ORG_ID = "a8414d8d-a9fd-4880-a557-01c9ef16046c"
PRIMARY_OWNER_EMAIL = "bhanushankar474@gmail.com"

DEFAULT_STAGES = [
    ("New", 1, 10, False, False),
    ("Qualified", 2, 25, False, False),
    ("Proposal", 3, 50, False, False),
    ("Negotiation", 4, 75, False, False),
    ("Closed Won", 5, 100, True, False),
    ("Closed Lost", 6, 0, False, True),
]

# Keep in sync with scripts/seed_users.py emails
SEED_USER_EMAILS = [
    "alex.morgan@novacrm.dev",
    "jordan.lee@novacrm.dev",
    "sam.rivera@novacrm.dev",
    "casey.nguyen@novacrm.dev",
    "riley.chen@novacrm.dev",
    "taylor.brooks@novacrm.dev",
    "morgan.hayes@novacrm.dev",
    "jamie.patel@novacrm.dev",
    "avery.collins@novacrm.dev",
    "cameron.diaz@novacrm.dev",
    "quinn.foster@novacrm.dev",
    "drew.bennett@novacrm.dev",
    "parker.singh@novacrm.dev",
    "reese.owens@novacrm.dev",
    "blake.martin@novacrm.dev",
    "skyler.adams@novacrm.dev",
    "finley.ross@novacrm.dev",
    "harper.kim@novacrm.dev",
    "rowan.baker@novacrm.dev",
    "sage.turner@novacrm.dev",
    "dakota.price@novacrm.dev",
    "emerson.ward@novacrm.dev",
    "phoenix.reed@novacrm.dev",
    "kennedy.lopez@novacrm.dev",
    "logan.mitchell@novacrm.dev",
    "charlie.nguyen@novacrm.dev",
    "jordan.wright@novacrm.dev",
    "nina.volkov@novacrm.dev",
    "omar.hassan@novacrm.dev",
]

# Fixed ids so re-seeding stays stable
SEED_ORGS = [
    {
        "id": PRIMARY_ORG_ID,
        "name": "Bhanu's Workspace",
        "slug": "bhanu-7de68701",
        "website": "https://novacrm.dev",
        "industry": "Software / SaaS",
        "company_size": "51-200",
        "setup_completed": True,
        "owner_email": PRIMARY_OWNER_EMAIL,
        "admins": [
            "jordan.lee@novacrm.dev",
            "dakota.price@novacrm.dev",
            "jamie.patel@novacrm.dev",
            "riley.chen@novacrm.dev",
        ],
        # None = all seed users + owner
        "member_emails": None,
    },
    {
        "id": "b2c3d4e5-f6a7-4890-b123-4567890abcde",
        "name": "Northstar Sales",
        "slug": "northstar-sales",
        "website": "https://northstar.example",
        "industry": "Financial Services",
        "company_size": "201-500",
        "setup_completed": True,
        "owner_email": "jordan.lee@novacrm.dev",
        "admins": [
            PRIMARY_OWNER_EMAIL,
            "dakota.price@novacrm.dev",
            "riley.chen@novacrm.dev",
        ],
        "member_emails": [
            "alex.morgan@novacrm.dev",
            "taylor.brooks@novacrm.dev",
            "parker.singh@novacrm.dev",
            "phoenix.reed@novacrm.dev",
            "nina.volkov@novacrm.dev",
            "sam.rivera@novacrm.dev",
            "morgan.hayes@novacrm.dev",
            "drew.bennett@novacrm.dev",
        ],
    },
    {
        "id": "c3d4e5f6-a7b8-4901-c234-567890abcdef",
        "name": "Orbit Labs CRM",
        "slug": "orbit-labs",
        "website": "https://orbitlabs.example",
        "industry": "Biotechnology",
        "company_size": "11-50",
        "setup_completed": True,
        "owner_email": "casey.nguyen@novacrm.dev",
        "admins": [
            PRIMARY_OWNER_EMAIL,
            "avery.collins@novacrm.dev",
            "harper.kim@novacrm.dev",
        ],
        "member_emails": [
            "omar.hassan@novacrm.dev",
            "kennedy.lopez@novacrm.dev",
            "reese.owens@novacrm.dev",
            "charlie.nguyen@novacrm.dev",
            "blake.martin@novacrm.dev",
            "jordan.wright@novacrm.dev",
        ],
    },
    {
        "id": "d4e5f6a7-b8c9-4012-d345-67890abcdef0",
        "name": "Brightline Growth",
        "slug": "brightline-growth",
        "website": "https://brightline.example",
        "industry": "Marketing / Agencies",
        "company_size": "1-10",
        "setup_completed": True,
        "owner_email": "quinn.foster@novacrm.dev",
        "admins": [PRIMARY_OWNER_EMAIL, "sage.turner@novacrm.dev"],
        "member_emails": [
            "skyler.adams@novacrm.dev",
            "logan.mitchell@novacrm.dev",
            "emerson.ward@novacrm.dev",
            "finley.ross@novacrm.dev",
            "rowan.baker@novacrm.dev",
            "cameron.diaz@novacrm.dev",
        ],
    },
    {
        "id": "e5f6a7b8-c9d0-4123-e456-7890abcdef01",
        "name": "Vertex Enterprise",
        "slug": "vertex-enterprise",
        "website": "https://vertex.example",
        "industry": "Manufacturing",
        "company_size": "501-1000",
        "setup_completed": False,
        "owner_email": "jamie.patel@novacrm.dev",
        "admins": [PRIMARY_OWNER_EMAIL, "alex.morgan@novacrm.dev"],
        "member_emails": [
            "taylor.brooks@novacrm.dev",
            "blake.martin@novacrm.dev",
            "nina.volkov@novacrm.dev",
            "sam.rivera@novacrm.dev",
        ],
    },
    {
        "id": "f6a7b8c9-d0e1-4234-f567-890abcdef012",
        "name": "Helio Retail Ops",
        "slug": "helio-retail",
        "website": "https://helio.example",
        "industry": "Retail",
        "company_size": "201-500",
        "setup_completed": True,
        "owner_email": "dakota.price@novacrm.dev",
        "admins": [
            PRIMARY_OWNER_EMAIL,
            "cameron.diaz@novacrm.dev",
            "rowan.baker@novacrm.dev",
        ],
        "member_emails": [
            "skyler.adams@novacrm.dev",
            "logan.mitchell@novacrm.dev",
            "reese.owens@novacrm.dev",
            "omar.hassan@novacrm.dev",
            "kennedy.lopez@novacrm.dev",
        ],
    },
    {
        "id": "a7b8c9d0-e1f2-4345-a678-90abcdef0123",
        "name": "CloudScale Partners",
        "slug": "cloudscale-partners",
        "website": "https://cloudscale.example",
        "industry": "Cloud Infrastructure",
        "company_size": "51-200",
        "setup_completed": True,
        "owner_email": "riley.chen@novacrm.dev",
        "admins": [
            PRIMARY_OWNER_EMAIL,
            "finley.ross@novacrm.dev",
            "blake.martin@novacrm.dev",
        ],
        "member_emails": [
            "jordan.wright@novacrm.dev",
            "phoenix.reed@novacrm.dev",
            "parker.singh@novacrm.dev",
            "drew.bennett@novacrm.dev",
            "emerson.ward@novacrm.dev",
            "taylor.brooks@novacrm.dev",
        ],
    },
    {
        "id": "b8c9d0e1-f2a3-4456-b789-0abcdef01234",
        "name": "BioHealth Pipeline",
        "slug": "biohealth-pipeline",
        "website": "https://biohealth.example",
        "industry": "Healthcare",
        "company_size": "11-50",
        "setup_completed": True,
        "owner_email": "harper.kim@novacrm.dev",
        "admins": [PRIMARY_OWNER_EMAIL, "casey.nguyen@novacrm.dev"],
        "member_emails": [
            "avery.collins@novacrm.dev",
            "kennedy.lopez@novacrm.dev",
            "omar.hassan@novacrm.dev",
            "charlie.nguyen@novacrm.dev",
            "nina.volkov@novacrm.dev",
        ],
    },
    {
        "id": "c9d0e1f2-a3b4-4567-c890-abcdef012345",
        "name": "Fintech Architects",
        "slug": "fintech-architects",
        "website": "https://fintecharch.example",
        "industry": "Fintech",
        "company_size": "51-200",
        "setup_completed": True,
        "owner_email": "alex.morgan@novacrm.dev",
        "admins": [
            PRIMARY_OWNER_EMAIL,
            "jordan.lee@novacrm.dev",
            "jamie.patel@novacrm.dev",
        ],
        "member_emails": [
            "sam.rivera@novacrm.dev",
            "morgan.hayes@novacrm.dev",
            "drew.bennett@novacrm.dev",
            "phoenix.reed@novacrm.dev",
            "nina.volkov@novacrm.dev",
            "jordan.wright@novacrm.dev",
        ],
    },
    {
        "id": "d0e1f2a3-b4c5-4678-d901-bcdef0123456",
        "name": "Nexus Field Sales",
        "slug": "nexus-field-sales",
        "website": "https://nexus.example",
        "industry": "Telecommunications",
        "company_size": "1001+",
        "setup_completed": False,
        "owner_email": "taylor.brooks@novacrm.dev",
        "admins": [PRIMARY_OWNER_EMAIL, "parker.singh@novacrm.dev"],
        "member_emails": [
            "rowan.baker@novacrm.dev",
            "cameron.diaz@novacrm.dev",
            "logan.mitchell@novacrm.dev",
            "emerson.ward@novacrm.dev",
            "skyler.adams@novacrm.dev",
            "sage.turner@novacrm.dev",
            "quinn.foster@novacrm.dev",
        ],
    },
]


def _role_for(org: dict, email: str) -> str:
    email = email.lower()
    if email == org["owner_email"].lower():
        return "owner"
    if email in {a.lower() for a in org.get("admins", [])}:
        return "admin"
    return "member"


def _ensure_pipeline(conn, organization_id: str) -> str:
    row = conn.execute(
        """
        select id from public.pipelines
        where organization_id = %s::uuid and is_default = true
        limit 1
        """,
        (organization_id,),
    ).fetchone()
    if row:
        return str(row[0])
    row = conn.execute(
        """
        insert into public.pipelines (organization_id, name, is_default, updated_at)
        values (%s::uuid, %s, true, now())
        returning id
        """,
        (organization_id, "Sales Pipeline"),
    ).fetchone()
    return str(row[0])


def _seed_stages(conn, organization_id: str) -> None:
    existing = conn.execute(
        """
        select id from public.pipeline_stages
        where organization_id = %s::uuid
        limit 1
        """,
        (organization_id,),
    ).fetchone()
    if existing:
        return
    pipeline_id = _ensure_pipeline(conn, organization_id)
    for name, position, probability, is_won, is_lost in DEFAULT_STAGES:
        conn.execute(
            """
            insert into public.pipeline_stages (
              organization_id, pipeline_id, name, position, probability, is_won, is_lost, updated_at
            )
            values (%s::uuid, %s::uuid, %s, %s, %s, %s, %s, now())
            """,
            (organization_id, pipeline_id, name, position, probability, is_won, is_lost),
        )


def main() -> int:
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL is missing in backend/.env", file=sys.stderr)
        return 1

    seed_ids = [org["id"] for org in SEED_ORGS]

    with psycopg.connect(url, connect_timeout=15) as conn:
        conn.execute("set statement_timeout = '60s'")

        deleted = conn.execute(
            """
            delete from public.organizations
            where id <> all(%s::uuid[])
            returning id, name
            """,
            (seed_ids,),
        ).fetchall()

        users = conn.execute(
            """
            select id, lower(email) as email
            from public.users
            where lower(email) = any(%s)
               or lower(email) = lower(%s)
            """,
            (
                [e.lower() for e in SEED_USER_EMAILS],
                PRIMARY_OWNER_EMAIL,
            ),
        ).fetchall()
        by_email = {email: user_id for user_id, email in users}

        summary = []
        for org in SEED_ORGS:
            owner_id = by_email.get(org["owner_email"].lower())
            row = conn.execute(
                """
                insert into public.organizations (
                  id, name, slug, website, industry, company_size, logo_url,
                  setup_completed, created_by, updated_at
                )
                values (
                  %s::uuid, %s, %s, %s, %s, %s, null, %s, %s, now()
                )
                on conflict (id) do update set
                  name = excluded.name,
                  slug = excluded.slug,
                  website = excluded.website,
                  industry = excluded.industry,
                  company_size = excluded.company_size,
                  setup_completed = excluded.setup_completed,
                  created_by = coalesce(excluded.created_by, organizations.created_by),
                  updated_at = now()
                returning id, name, slug
                """,
                (
                    org["id"],
                    org["name"],
                    org["slug"],
                    org["website"],
                    org["industry"],
                    org["company_size"],
                    org["setup_completed"],
                    owner_id,
                ),
            ).fetchone()

            _seed_stages(conn, org["id"])

            if org["member_emails"] is None:
                member_emails = sorted(
                    {
                        *[e.lower() for e in SEED_USER_EMAILS],
                        org["owner_email"].lower(),
                        *[a.lower() for a in org.get("admins", [])],
                    }
                )
            else:
                member_emails = sorted(
                    {
                        org["owner_email"].lower(),
                        *[a.lower() for a in org.get("admins", [])],
                        *[e.lower() for e in org["member_emails"]],
                    }
                )

            inserted = updated = skipped = 0
            for email in member_emails:
                user_id = by_email.get(email)
                if not user_id:
                    skipped += 1
                    continue
                result = conn.execute(
                    """
                    insert into public.organization_members (
                      organization_id, user_id, role
                    )
                    values (%s::uuid, %s::uuid, %s)
                    on conflict (organization_id, user_id) do update set
                      role = excluded.role
                    returning (xmax = 0) as inserted
                    """,
                    (org["id"], user_id, _role_for(org, email)),
                ).fetchone()
                if result and result[0]:
                    inserted += 1
                else:
                    updated += 1

            # Remove stale memberships for this seeded org
            conn.execute(
                """
                delete from public.organization_members om
                using public.users u
                where om.user_id = u.id
                  and om.organization_id = %s::uuid
                  and lower(u.email) <> all(%s)
                """,
                (org["id"], member_emails),
            )

            member_count = conn.execute(
                """
                select count(*) from public.organization_members
                where organization_id = %s::uuid
                """,
                (org["id"],),
            ).fetchone()[0]

            summary.append(
                {
                    "row": row,
                    "members": member_count,
                    "inserted": inserted,
                    "updated": updated,
                    "skipped": skipped,
                }
            )

        conn.commit()

        org_count = conn.execute(
            "select count(*) from public.organizations"
        ).fetchone()[0]

    if deleted:
        print(f"Removed {len(deleted)} non-seed organization(s):")
        for org_id, name in deleted:
            print(f"  - {org_id} ({name})")
    else:
        print("No non-seed organizations to remove.")

    print(f"Seeded {len(summary)} workspaces (total orgs: {org_count})")
    for item in summary:
        org_id, name, slug = item["row"]
        print(
            f"- {name} [{slug}] {org_id} · members={item['members']} "
            f"(+{item['inserted']}/~{item['updated']}, skip={item['skipped']})"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
