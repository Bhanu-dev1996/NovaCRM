-- NovaCRM full schema — run in Supabase SQL Editor
-- Dashboard → SQL → New query → Run

create extension if not exists "pgcrypto";

-- —— Auth / workspace ——
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  google_id text unique,
  email text not null unique,
  name text,
  avatar_url text,
  password_hash text,
  email_verified boolean not null default false,
  verification_token text,
  verification_expires_at timestamptz,
  verification_sent_at timestamptz,
  reset_token text,
  reset_expires_at timestamptz,
  reset_sent_at timestamptz,
  job_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website text,
  industry text,
  company_size text,
  logo_url text,
  setup_completed boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- —— CRM core ——
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  domain text,
  industry text,
  size text,
  website text,
  phone text,
  owner_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  first_name text,
  last_name text,
  email text,
  phone text,
  title text,
  owner_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  pipeline_id uuid references public.pipelines (id) on delete cascade,
  name text not null,
  position int not null default 0,
  probability numeric(5, 2) not null default 0,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.deal_probability_options (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  value numeric(5, 2) not null
    check (value >= 0 and value <= 100),
  position int not null default 0,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, value)
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  pipeline_id uuid references public.pipelines (id) on delete set null,
  stage_id uuid references public.pipeline_stages (id) on delete set null,
  owner_id uuid references public.users (id) on delete set null,
  name text not null,
  amount numeric(14, 2) not null default 0,
  currency text not null default 'USD',
  ai_score numeric(5, 2),
  probability numeric(5, 2)
    check (probability is null or (probability >= 0 and probability <= 100)),
  expected_close_date date,
  actual_close_date date,
  lead_source text,
  priority text,
  description text,
  notes text,
  next_step text,
  loss_reason text,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  owner_id uuid references public.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  company_name text,
  title text,
  source text not null default 'Website'
    check (source in ('Website', 'Referral', 'LinkedIn', 'Campaign', 'Manual')),
  industry text,
  status text not null default 'New'
    check (status in ('New', 'Contacted', 'Qualified', 'Nurturing', 'Converted', 'Lost')),
  score numeric(5, 2) not null default 50
    check (score >= 0 and score <= 100),
  notes text,
  last_contacted_at timestamptz,
  converted_contact_id uuid references public.contacts (id) on delete set null,
  converted_deal_id uuid references public.deals (id) on delete set null,
  converted_at timestamptz,
  related jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  deal_id uuid references public.deals (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  company_id uuid references public.companies (id) on delete set null,
  user_id uuid references public.users (id) on delete set null,
  type text not null check (type in ('note', 'call', 'email', 'meeting', 'task')),
  subject text,
  body text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  deal_id uuid references public.deals (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  assignee_id uuid references public.users (id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- —— Indexes ——
create index if not exists users_email_idx on public.users (email);
create index if not exists companies_org_idx on public.companies (organization_id);
create index if not exists contacts_org_idx on public.contacts (organization_id);
create index if not exists contacts_company_idx on public.contacts (company_id);
create index if not exists deal_probability_options_org_idx
  on public.deal_probability_options (organization_id, position);
create index if not exists pipelines_org_idx on public.pipelines (organization_id);
create index if not exists pipeline_stages_org_idx on public.pipeline_stages (organization_id, position);
create index if not exists pipeline_stages_pipeline_idx
  on public.pipeline_stages (pipeline_id, position);
create index if not exists deals_org_idx on public.deals (organization_id);
create index if not exists deals_stage_idx on public.deals (stage_id);
create index if not exists leads_org_idx on public.leads (organization_id);
create index if not exists leads_org_status_idx on public.leads (organization_id, status);
create index if not exists leads_org_owner_idx on public.leads (organization_id, owner_id);
create index if not exists leads_org_email_idx on public.leads (organization_id, email);
create index if not exists leads_company_idx on public.leads (company_id);
create index if not exists activities_org_idx on public.activities (organization_id);
create index if not exists tasks_org_idx on public.tasks (organization_id);

-- —— RLS (backend uses service_role; no anon access) ——
alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.deal_probability_options enable row level security;
alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.deals enable row level security;
alter table public.leads enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;
