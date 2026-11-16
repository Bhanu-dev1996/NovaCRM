-- Marketing module (Phase 1): campaigns, audiences, templates — no bulk send

create table if not exists public.mkt_segments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  segment_type text not null default 'dynamic'
    check (segment_type in ('static', 'dynamic')),
  filters jsonb not null default '{"logic":"and","conditions":[]}'::jsonb,
  contact_ids jsonb not null default '[]'::jsonb,
  owner_id uuid references public.users (id) on delete set null,
  contact_count integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mkt_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  category text not null default 'General',
  subject text not null default '',
  body text not null default '',
  visibility text not null default 'workspace'
    check (visibility in ('workspace', 'private')),
  owner_id uuid references public.users (id) on delete set null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mkt_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  objective text not null default '',
  campaign_type text not null default 'email'
    check (campaign_type in (
      'email', 'event', 'product_announcement', 'newsletter', 'follow_up'
    )),
  description text,
  status text not null default 'draft'
    check (status in (
      'draft', 'scheduled', 'active', 'completed', 'archived', 'ready_for_review'
    )),
  owner_id uuid references public.users (id) on delete set null,
  segment_id uuid references public.mkt_segments (id) on delete set null,
  audience jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  schedule jsonb not null default '{}'::jsonb,
  linked_records jsonb not null default '{}'::jsonb,
  performance jsonb not null default '{}'::jsonb,
  estimated_recipients integer not null default 0,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mkt_campaigns_org_idx
  on public.mkt_campaigns (organization_id, updated_at desc);

create index if not exists mkt_segments_org_idx
  on public.mkt_segments (organization_id, updated_at desc);

create index if not exists mkt_templates_org_idx
  on public.mkt_templates (organization_id, updated_at desc);

alter table public.mkt_segments enable row level security;
alter table public.mkt_templates enable row level security;
alter table public.mkt_campaigns enable row level security;
