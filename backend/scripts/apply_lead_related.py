"""Apply the leads.related jsonb column if it is missing."""

from pathlib import Path
import os
import sys

from dotenv import load_dotenv
import psycopg

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

url = os.getenv("DATABASE_URL")
if not url:
    print("DATABASE_URL is missing in backend/.env", file=sys.stderr)
    sys.exit(1)

sql = (ROOT / "supabase" / "migrations" / "006_lead_related.sql").read_text(
    encoding="utf-8"
)

with psycopg.connect(url) as conn:
    conn.execute(sql)
    conn.commit()
    row = conn.execute(
        """
        select column_name, data_type
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'leads'
          and column_name = 'related'
        """
    ).fetchone()

print("leads.related:", row)
