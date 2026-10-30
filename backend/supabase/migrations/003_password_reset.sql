alter table public.users
  add column if not exists reset_token text;

alter table public.users
  add column if not exists reset_expires_at timestamptz;

alter table public.users
  add column if not exists reset_sent_at timestamptz;
