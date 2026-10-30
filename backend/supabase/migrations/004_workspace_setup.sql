alter table public.organizations
  add column if not exists website text;

alter table public.organizations
  add column if not exists industry text;

alter table public.organizations
  add column if not exists company_size text;

alter table public.organizations
  add column if not exists logo_url text;

alter table public.organizations
  add column if not exists setup_completed boolean not null default false;

alter table public.users
  add column if not exists job_role text;
