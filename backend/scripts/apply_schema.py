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

schema_path = ROOT / "supabase" / "schema.sql"
sql = schema_path.read_text(encoding="utf-8")

with psycopg.connect(url) as conn:
    conn.execute(sql)
    conn.commit()
    rows = conn.execute(
        """
        select table_name
        from information_schema.tables
        where table_schema = 'public'
        order by table_name
        """
    ).fetchall()

print("Created/verified tables:")
for (name,) in rows:
    print(f"- {name}")
