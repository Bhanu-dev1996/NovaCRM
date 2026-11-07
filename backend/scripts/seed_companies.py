"""Seed or backfill demo companies for the primary workspace (idempotent upsert)."""

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
    SEED_COMPANY_RECORDS,
)

load_dotenv(ROOT / ".env")

PRIMARY_ORG_ID = "a8414d8d-a9fd-4880-a557-01c9ef16046c"


def main() -> None:
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL missing", file=sys.stderr)
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
            print("Organization not found")
            sys.exit(1)

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
            if user_id:
                owner_id_by_key[key] = user_id

        default_owner = user_id_by_email.get(OWNER_EMAIL_BY_KEY["alex"].lower())

        for row in SEED_COMPANY_RECORDS:
            owner_id = owner_id_by_key.get(row.get("owner_key")) or default_owner
            existing = conn.execute(
                """
                select id from companies
                where organization_id = %s and lower(name) = lower(%s)
                limit 1
                """,
                (PRIMARY_ORG_ID, row["name"]),
            ).fetchone()

            if existing:
                conn.execute(
                    """
                    update companies set
                      domain = %s,
                      website = %s,
                      industry = %s,
                      size = %s,
                      phone = %s,
                      owner_id = coalesce(%s, owner_id),
                      updated_at = %s
                    where id = %s
                    """,
                    (
                        row.get("domain"),
                        row.get("website"),
                        row.get("industry"),
                        row.get("size"),
                        row.get("phone"),
                        owner_id,
                        now,
                        existing[0],
                    ),
                )
                updated += 1
                continue

            conn.execute(
                """
                insert into companies (
                  organization_id, name, domain, website, industry, size, phone,
                  owner_id, created_at, updated_at
                ) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    PRIMARY_ORG_ID,
                    row["name"],
                    row.get("domain"),
                    row.get("website"),
                    row.get("industry"),
                    row.get("size"),
                    row.get("phone"),
                    owner_id,
                    now,
                    now,
                ),
            )
            created += 1

        conn.commit()
        print(
            f"Companies for {org[1]}: {created} created, {updated} updated "
            f"({len(SEED_COMPANY_RECORDS)} definitions)"
        )


if __name__ == "__main__":
    main()
