-- Leads — workspace-scoped prospect records

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_org_idx on public.leads (organization_id);
create index if not exists leads_org_status_idx on public.leads (organization_id, status);
create index if not exists leads_org_owner_idx on public.leads (organization_id, owner_id);
create index if not exists leads_org_email_idx on public.leads (organization_id, email);
create index if not exists leads_company_idx on public.leads (company_id);

alter table public.leads enable row level security;
