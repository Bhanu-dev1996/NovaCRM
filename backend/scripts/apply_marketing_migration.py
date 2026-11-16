"""Apply 012_marketing.sql to the database configured in backend/.env."""

from pathlib import Path

from app.db import get_connection

ROOT = Path(__file__).resolve().parents[1]
SQL = ROOT / "supabase" / "migrations" / "012_marketing.sql"


def main() -> None:
    sql = SQL.read_text(encoding="utf-8")
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
    print("Applied", SQL.name)


if __name__ == "__main__":
    main()
