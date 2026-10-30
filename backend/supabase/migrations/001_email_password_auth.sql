-- Email/password auth support
alter table public.users
  alter column google_id drop not null;

alter table public.users
  add column if not exists password_hash text;
