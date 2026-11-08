# NovaCRM

Monorepo with a Next.js frontend and FastAPI backend.

## Structure

```
frontend/   Next.js app (UI)
backend/    FastAPI + Google OAuth + Supabase Postgres (port 4000)
```

## Setup

From the repo root:

```bash
npm run setup
```

That installs `frontend/node_modules` and creates `backend/.venv`.

Or step by step:

```bash
cd frontend && npm install
cd ../backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Env secrets live only in the backend:

- Copy `backend/.env.example` → `backend/.env`

Frontend has no `.env` files (API URL defaults to `http://localhost:4000`).

Fill in `backend/.env`:

- Google OAuth: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Database: `DATABASE_URL` — Supabase **Postgres URI**  
  Project Settings → Database → Connect → URI  
  Example: `postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres`
- Verification email (so signup mail reaches the inbox):
  - **Resend:** set `RESEND_API_KEY` (free at [resend.com](https://resend.com))  
    Test sender `onboarding@resend.dev` only delivers to your Resend account email.  
    For any inbox, verify a domain and set `EMAIL_FROM`.
  - **Or SMTP:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`

In Google Cloud Console, set the redirect URI to:

`http://localhost:4000/api/auth/google/callback`

### Database (all CRM data)

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run `backend/supabase/schema.sql`
3. Put the Postgres connection URI in `DATABASE_URL`

Tables: `users`, `organizations`, `organization_members`, `companies`, `contacts`, `pipeline_stages`, `deals`, `activities`, `tasks`

Seed demo users + workspace (verified, password `Password123!`):

```bash
cd backend
.venv\Scripts\python scripts\seed_users.py
.venv\Scripts\python scripts\seed_organization.py
.venv\Scripts\python scripts\seed_contacts.py
.venv\Scripts\python scripts\seed_leads.py
.venv\Scripts\python scripts\seed_companies.py
.venv\Scripts\python scripts\seed_contact_links.py
.venv\Scripts\python scripts\seed_deals.py
```

That keeps workspace `a8414d8d-a9fd-4880-a557-01c9ef16046c`, seeds extra demo workspaces, and attaches members. Contact and lead seeds run only when those tables are empty for that workspace. `seed_deals.py` upserts pipeline stages and ~20 demo deals across the funnel (INR, open/won/lost).

Or run `backend/supabase/seeds/001_users.sql` and `002_organization.sql` in the Supabase SQL Editor.

Auth options:

- Google OAuth → upserts `users` (no password)
- Email/password → `/signup` creates account, `/login` signs in; stores **bcrypt** `password_hash` in `users` (never plain text)

Both create a default workspace and seed pipeline stages.

Authenticated CRM API (cookie session):

- `GET/POST /api/companies|contacts|deals|activities|tasks|pipeline-stages`
- `GET/PATCH/DELETE /api/{resource}/{id}`
- `GET /api/workspace`

## Develop

```bash
npm run dev
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:4000 (`/api/health`, docs at `/docs`)

Or run one side:

```bash
npm run dev:frontend
npm run dev:backend
```
