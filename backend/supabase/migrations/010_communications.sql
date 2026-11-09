-- Communications module: inbox threads, messages, templates, workspace settings

alter table public.organizations
  add column if not exists comm_settings jsonb not null default '{}'::jsonb;

create table if not exists public.comm_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  channel text not null default 'email' check (channel in ('email', 'call')),
  subject text,
  contact_id uuid references public.contacts (id) on delete set null,
  company_id uuid references public.companies (id) on delete set null,
  deal_id uuid references public.deals (id) on delete set null,
  contact_name text,
  contact_email text,
  company_name text,
  deal_name text,
  job_title text,
  phone text,
  assignee_id uuid references public.users (id) on delete set null,
  starred boolean not null default false,
  archived boolean not null default false,
  unread_count integer not null default 0,
  awaiting_response boolean not null default false,
  last_message_preview text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comm_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  conversation_id uuid not null references public.comm_conversations (id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  channel text not null default 'email',
  status text not null default 'sent',
  sender_name text,
  sender_email text,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.comm_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  category text not null default 'Follow-up',
  subject text not null,
  body text not null,
  visibility text not null default 'workspace' check (visibility in ('workspace', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comm_conversations_org_idx
  on public.comm_conversations (organization_id, last_message_at desc nulls last);

create index if not exists comm_messages_conv_idx
  on public.comm_messages (conversation_id, created_at);

create index if not exists comm_templates_org_idx
  on public.comm_templates (organization_id, updated_at desc);

alter table public.comm_conversations enable row level security;
alter table public.comm_messages enable row level security;
alter table public.comm_templates enable row level security;
