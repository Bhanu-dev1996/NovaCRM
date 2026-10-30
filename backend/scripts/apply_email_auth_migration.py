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

sql = (ROOT / "supabase" / "migrations" / "001_email_password_auth.sql").read_text(
    encoding="utf-8"
)

with psycopg.connect(url) as conn:
    conn.execute(sql)
    conn.commit()
    row = conn.execute(
        """
        select column_name, is_nullable
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'users'
          and column_name in ('google_id', 'password_hash')
        order by column_name
        """
    ).fetchall()

print("Email/password migration applied:")
for name, nullable in row:
    print(f"- {name} (nullable={nullable})")
