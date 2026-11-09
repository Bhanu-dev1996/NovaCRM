-- Extended activity fields for Activities module (status, priority, relationships, meta)

alter table public.activities
  add column if not exists lead_id uuid references public.leads (id) on delete set null;

alter table public.activities
  add column if not exists assignee_id uuid references public.users (id) on delete set null;

alter table public.activities
  add column if not exists status text;

alter table public.activities
  add column if not exists priority text;

alter table public.activities
  add column if not exists meta jsonb not null default '{}'::jsonb;

alter table public.tasks
  add column if not exists company_id uuid references public.companies (id) on delete set null;

alter table public.tasks
  add column if not exists lead_id uuid references public.leads (id) on delete set null;

create index if not exists activities_due_idx on public.activities (organization_id, due_at);
create index if not exists activities_type_idx on public.activities (organization_id, type);
create index if not exists tasks_due_idx on public.tasks (organization_id, due_at);
