"""Seed demo inbox conversations for the primary workspace (skips if any exist)."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.comm_seed_data import seed_demo_conversations  # noqa: E402

load_dotenv(ROOT / ".env")

PRIMARY_ORG_ID = "a8414d8d-a9fd-4880-a557-01c9ef16046c"


def main() -> None:
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL is not set")
        sys.exit(1)

    with psycopg.connect(url) as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                select count(*)::int from comm_conversations
                where organization_id = %s
                """,
                (PRIMARY_ORG_ID,),
            )
            row = cur.fetchone()
            existing = int((row or {}).get("count") or 0)
            if existing:
                print(f"Skipping: {existing} conversation(s) already exist for workspace.")
                return
            n = seed_demo_conversations(cur, PRIMARY_ORG_ID)
        conn.commit()
    print(f"Seeded {n} demo conversations.")


if __name__ == "__main__":
    main()
