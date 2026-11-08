"""Apply NovaCRM Postgres schema (base + migrations) to DATABASE_URL."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
import psycopg

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "supabase" / "migrations"
SCHEMA = ROOT / "supabase" / "schema.sql"

EXPECTED_TABLES = (
    "users",
    "organizations",
    "organization_members",
    "companies",
    "contacts",
    "pipelines",
    "pipeline_stages",
    "deal_probability_options",
    "deals",
    "leads",
    "activities",
    "tasks",
)


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Apply NovaCRM database schema")
    parser.add_argument(
        "--fresh",
        action="store_true",
        help="Also run schema.sql (use only on empty databases)",
    )
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL is missing in backend/.env", file=sys.stderr)
        return 1

    migration_files = sorted(MIGRATIONS.glob("*.sql"))
    if not migration_files and not SCHEMA.is_file():
        print("No SQL files found under backend/supabase/", file=sys.stderr)
        return 1

    with psycopg.connect(url) as conn:
        if args.fresh and SCHEMA.is_file():
            print("Applying schema.sql…")
            conn.execute(SCHEMA.read_text(encoding="utf-8"))
        for path in migration_files:
            print(f"Applying {path.name}…")
            conn.execute(path.read_text(encoding="utf-8"))
        conn.commit()

        rows = conn.execute(
            """
            select table_name
            from information_schema.tables
            where table_schema = 'public'
              and table_type = 'BASE TABLE'
            order by table_name
            """
        ).fetchall()
        present = {row[0] for row in rows}

    print("\nPublic tables:")
    for table in sorted(present):
        mark = "✓" if table in EXPECTED_TABLES else " "
        print(f"  {mark} {table}")

    missing = [t for t in EXPECTED_TABLES if t not in present]
    if missing:
        print("\nMissing expected tables:", ", ".join(missing), file=sys.stderr)
        return 1

    print(f"\nAll {len(EXPECTED_TABLES)} CRM tables are present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
