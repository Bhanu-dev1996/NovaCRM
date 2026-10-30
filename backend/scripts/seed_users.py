"""Seed demo users into public.users (idempotent on email)."""

from pathlib import Path
import os
import sys

from dotenv import load_dotenv
import psycopg

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

load_dotenv(ROOT / ".env")

from app.auth.passwords import hash_password  # noqa: E402

# Shared demo password for local / staging sign-in
DEFAULT_PASSWORD = "Password123!"

SEED_USERS = [
    {
        "email": "alex.morgan@novacrm.dev",
        "name": "Alex Morgan",
        "job_role": "Account Executive",
    },
    {
        "email": "jordan.lee@novacrm.dev",
        "name": "Jordan Lee",
        "job_role": "Sales Manager",
    },
    {
        "email": "sam.rivera@novacrm.dev",
        "name": "Sam Rivera",
        "job_role": "SDR",
    },
    {
        "email": "casey.nguyen@novacrm.dev",
        "name": "Casey Nguyen",
        "job_role": "Customer Success",
    },
    {
        "email": "riley.chen@novacrm.dev",
        "name": "Riley Chen",
        "job_role": "RevOps",
    },
    # +22 more demo users
    {
        "email": "taylor.brooks@novacrm.dev",
        "name": "Taylor Brooks",
        "job_role": "Account Executive",
    },
    {
        "email": "morgan.hayes@novacrm.dev",
        "name": "Morgan Hayes",
        "job_role": "SDR",
    },
    {
        "email": "jamie.patel@novacrm.dev",
        "name": "Jamie Patel",
        "job_role": "Sales Manager",
    },
    {
        "email": "avery.collins@novacrm.dev",
        "name": "Avery Collins",
        "job_role": "Customer Success",
    },
    {
        "email": "cameron.diaz@novacrm.dev",
        "name": "Cameron Diaz",
        "job_role": "Account Executive",
    },
    {
        "email": "quinn.foster@novacrm.dev",
        "name": "Quinn Foster",
        "job_role": "Marketing",
    },
    {
        "email": "drew.bennett@novacrm.dev",
        "name": "Drew Bennett",
        "job_role": "BDR",
    },
    {
        "email": "parker.singh@novacrm.dev",
        "name": "Parker Singh",
        "job_role": "Account Executive",
    },
    {
        "email": "reese.owens@novacrm.dev",
        "name": "Reese Owens",
        "job_role": "Support",
    },
    {
        "email": "blake.martin@novacrm.dev",
        "name": "Blake Martin",
        "job_role": "Sales Engineer",
    },
    {
        "email": "skyler.adams@novacrm.dev",
        "name": "Skyler Adams",
        "job_role": "SDR",
    },
    {
        "email": "finley.ross@novacrm.dev",
        "name": "Finley Ross",
        "job_role": "RevOps",
    },
    {
        "email": "harper.kim@novacrm.dev",
        "name": "Harper Kim",
        "job_role": "Customer Success",
    },
    {
        "email": "rowan.baker@novacrm.dev",
        "name": "Rowan Baker",
        "job_role": "Account Executive",
    },
    {
        "email": "sage.turner@novacrm.dev",
        "name": "Sage Turner",
        "job_role": "Product Marketing",
    },
    {
        "email": "dakota.price@novacrm.dev",
        "name": "Dakota Price",
        "job_role": "Sales Manager",
    },
    {
        "email": "emerson.ward@novacrm.dev",
        "name": "Emerson Ward",
        "job_role": "BDR",
    },
    {
        "email": "phoenix.reed@novacrm.dev",
        "name": "Phoenix Reed",
        "job_role": "Account Executive",
    },
    {
        "email": "kennedy.lopez@novacrm.dev",
        "name": "Kennedy Lopez",
        "job_role": "Customer Success",
    },
    {
        "email": "logan.mitchell@novacrm.dev",
        "name": "Logan Mitchell",
        "job_role": "SDR",
    },
    {
        "email": "charlie.nguyen@novacrm.dev",
        "name": "Charlie Nguyen",
        "job_role": "Support",
    },
    {
        "email": "jordan.wright@novacrm.dev",
        "name": "Jordan Wright",
        "job_role": "Sales Engineer",
    },
    {
        "email": "nina.volkov@novacrm.dev",
        "name": "Nina Volkov",
        "job_role": "Account Executive",
    },
    {
        "email": "omar.hassan@novacrm.dev",
        "name": "Omar Hassan",
        "job_role": "Customer Success",
    },
]


def main() -> int:
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL is missing in backend/.env", file=sys.stderr)
        return 1

    password_hash = hash_password(DEFAULT_PASSWORD)

    with psycopg.connect(url) as conn:
        inserted = 0
        updated = 0
        for user in SEED_USERS:
            row = conn.execute(
                """
                insert into public.users (
                  email, name, password_hash, email_verified, job_role, updated_at
                )
                values (%s, %s, %s, true, %s, now())
                on conflict (email) do update set
                  name = excluded.name,
                  password_hash = excluded.password_hash,
                  email_verified = true,
                  job_role = excluded.job_role,
                  verification_token = null,
                  verification_expires_at = null,
                  updated_at = now()
                returning (xmax = 0) as inserted
                """,
                (
                    user["email"],
                    user["name"],
                    password_hash,
                    user["job_role"],
                ),
            ).fetchone()
            if row and row[0]:
                inserted += 1
            else:
                updated += 1
        conn.commit()

        rows = conn.execute(
            """
            select email, name, job_role, email_verified
            from public.users
            where email = any(%s)
            order by email
            """,
            ([u["email"] for u in SEED_USERS],),
        ).fetchall()

    print(f"Seeded users ({inserted} inserted, {updated} updated).")
    print(f"Password for all: {DEFAULT_PASSWORD}")
    for email, name, job_role, verified in rows:
        print(f"- {name} <{email}> · {job_role} · verified={verified}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
