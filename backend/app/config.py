import os

from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", "4000"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000").rstrip("/")

AUTH_SECRET = os.getenv("AUTH_SECRET", "")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

# Direct Postgres connection (Supabase → Project Settings → Database → URI)
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Phone country list source (defaults to https://countries.dev/countries).
COUNTRIES_API_URL = os.getenv("COUNTRIES_API_URL", "").strip()

# Transactional email (pick one): Resend API or SMTP
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
EMAIL_FROM = os.getenv("EMAIL_FROM", "").strip()
SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()

# When true (default on localhost), show a clickable verify link in the UI if
# Resend cannot deliver to arbitrary inboxes (test sender limitation).
_email_dev_links = os.getenv("EMAIL_DEV_LINKS", "").strip().lower()
if _email_dev_links in {"1", "true", "yes", "on"}:
    EMAIL_DEV_LINKS = True
elif _email_dev_links in {"0", "false", "no", "off"}:
    EMAIL_DEV_LINKS = False
else:
    EMAIL_DEV_LINKS = "localhost" in FRONTEND_URL or "127.0.0.1" in FRONTEND_URL

SESSION_COOKIE = "novacrm_session"
ORGANIZATION_COOKIE = "novacrm_organization"
SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7 days
