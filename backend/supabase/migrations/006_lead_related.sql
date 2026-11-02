-- Extra companies/contacts/deals linked to a lead (beyond the primary company_id)

alter table public.leads
  add column if not exists related jsonb not null default '{}'::jsonb;
