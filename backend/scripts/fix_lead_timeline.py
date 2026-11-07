"""Set created_at before last_contacted_at when demo seed used now() for created_at."""

from pathlib import Path
import os
import sys

from dotenv import load_dotenv
import psycopg

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

load_dotenv(ROOT / ".env")


def main() -> None:
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL is missing in backend/.env", file=sys.stderr)
        sys.exit(1)

    with psycopg.connect(url) as conn:
        updated = conn.execute(
            """
            update leads
            set
              created_at = last_contacted_at - interval '21 days',
              updated_at = greatest(updated_at, last_contacted_at)
            where last_contacted_at is not null
              and created_at > last_contacted_at
            """
        ).rowcount
        conn.commit()
        print(f"Adjusted created_at on {updated} lead(s).")


if __name__ == "__main__":
    main()
