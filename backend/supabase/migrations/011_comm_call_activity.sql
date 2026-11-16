-- Link call-log conversations to Activities for sync/dedup

alter table public.comm_conversations
  add column if not exists source_activity_id uuid references public.activities (id) on delete cascade;

create unique index if not exists comm_conversations_source_activity_idx
  on public.comm_conversations (organization_id, source_activity_id)
  where source_activity_id is not null;
