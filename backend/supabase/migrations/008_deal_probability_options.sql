-- Lookup table for deal win-probability dropdown (per workspace, 0–100 step 5 by default)

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

create index if not exists deal_probability_options_org_idx
  on public.deal_probability_options (organization_id, position);

-- Seed 0, 5, 10, … 100 for orgs that have no options yet
insert into public.deal_probability_options (organization_id, value, position, updated_at)
select
  o.id,
  (gs.n * 5)::numeric(5, 2),
  gs.n + 1,
  now()
from public.organizations o
cross join generate_series(0, 20) as gs(n)
where not exists (
  select 1
  from public.deal_probability_options d
  where d.organization_id = o.id
  limit 1
);

alter table public.deal_probability_options enable row level security;
