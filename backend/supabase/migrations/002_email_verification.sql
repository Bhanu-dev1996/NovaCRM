alter table public.users
  add column if not exists email_verified boolean not null default false;

alter table public.users
  add column if not exists verification_token text;

alter table public.users
  add column if not exists verification_expires_at timestamptz;

alter table public.users
  add column if not exists verification_sent_at timestamptz;

-- Existing accounts are treated as already verified.
update public.users
set email_verified = true
where email_verified = false
  and (
    google_id is not null
    or password_hash is not null
  );
