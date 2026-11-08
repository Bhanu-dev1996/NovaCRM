-- Pipelines (per workspace) and deal-level win probability / extended deal fields

create table if not exists public.pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create index if not exists pipelines_org_idx on public.pipelines (organization_id);

alter table public.pipeline_stages
  add column if not exists pipeline_id uuid references public.pipelines (id) on delete cascade;

create index if not exists pipeline_stages_pipeline_idx
  on public.pipeline_stages (pipeline_id, position);

alter table public.deals
  add column if not exists pipeline_id uuid references public.pipelines (id) on delete set null;

alter table public.deals
  add column if not exists probability numeric(5, 2)
    check (probability is null or (probability >= 0 and probability <= 100));

alter table public.deals
  add column if not exists lead_source text;

alter table public.deals
  add column if not exists priority text;

alter table public.deals
  add column if not exists description text;

alter table public.deals
  add column if not exists notes text;

alter table public.deals
  add column if not exists next_step text;

alter table public.deals
  add column if not exists loss_reason text;

alter table public.deals
  add column if not exists actual_close_date date;

alter table public.deals
  add column if not exists meta jsonb not null default '{}'::jsonb;

-- Default pipeline per org (for existing workspaces with stages)
insert into public.pipelines (organization_id, name, is_default, updated_at)
select distinct ps.organization_id, 'Sales Pipeline', true, now()
from public.pipeline_stages ps
where not exists (
  select 1
  from public.pipelines p
  where p.organization_id = ps.organization_id
);

insert into public.pipelines (organization_id, name, is_default, updated_at)
select o.id, 'Sales Pipeline', true, now()
from public.organizations o
where not exists (
  select 1 from public.pipelines p where p.organization_id = o.id
);

update public.pipeline_stages ps
set pipeline_id = p.id
from public.pipelines p
where ps.pipeline_id is null
  and p.organization_id = ps.organization_id
  and p.is_default = true;

update public.deals d
set pipeline_id = p.id
from public.pipelines p
where d.pipeline_id is null
  and p.organization_id = d.organization_id
  and p.is_default = true;

alter table public.pipelines enable row level security;
