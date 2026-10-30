-- Seed workspaces + memberships.
-- Prefer: python backend/scripts/seed_organization.py
-- Primary workspace id is preserved: a8414d8d-a9fd-4880-a557-01c9ef16046c

delete from public.organizations
where id not in (
  'a8414d8d-a9fd-4880-a557-01c9ef16046c'::uuid,
  'b2c3d4e5-f6a7-4890-b123-4567890abcde'::uuid,
  'c3d4e5f6-a7b8-4901-c234-567890abcdef'::uuid,
  'd4e5f6a7-b8c9-4012-d345-67890abcdef0'::uuid,
  'e5f6a7b8-c9d0-4123-e456-7890abcdef01'::uuid,
  'f6a7b8c9-d0e1-4234-f567-890abcdef012'::uuid,
  'a7b8c9d0-e1f2-4345-a678-90abcdef0123'::uuid,
  'b8c9d0e1-f2a3-4456-b789-0abcdef01234'::uuid,
  'c9d0e1f2-a3b4-4567-c890-abcdef012345'::uuid,
  'd0e1f2a3-b4c5-4678-d901-bcdef0123456'::uuid
);

insert into public.organizations (
  id, name, slug, website, industry, company_size, logo_url, setup_completed, updated_at
)
values
  ('a8414d8d-a9fd-4880-a557-01c9ef16046c'::uuid, 'Bhanu''s Workspace', 'bhanu-7de68701', 'https://novacrm.dev', 'Software / SaaS', '51-200', null, true, now()),
  ('b2c3d4e5-f6a7-4890-b123-4567890abcde'::uuid, 'Northstar Sales', 'northstar-sales', 'https://northstar.example', 'Financial Services', '201-500', null, true, now()),
  ('c3d4e5f6-a7b8-4901-c234-567890abcdef'::uuid, 'Orbit Labs CRM', 'orbit-labs', 'https://orbitlabs.example', 'Biotechnology', '11-50', null, true, now()),
  ('d4e5f6a7-b8c9-4012-d345-67890abcdef0'::uuid, 'Brightline Growth', 'brightline-growth', 'https://brightline.example', 'Marketing / Agencies', '1-10', null, true, now()),
  ('e5f6a7b8-c9d0-4123-e456-7890abcdef01'::uuid, 'Vertex Enterprise', 'vertex-enterprise', 'https://vertex.example', 'Manufacturing', '501-1000', null, false, now()),
  ('f6a7b8c9-d0e1-4234-f567-890abcdef012'::uuid, 'Helio Retail Ops', 'helio-retail', 'https://helio.example', 'Retail', '201-500', null, true, now()),
  ('a7b8c9d0-e1f2-4345-a678-90abcdef0123'::uuid, 'CloudScale Partners', 'cloudscale-partners', 'https://cloudscale.example', 'Cloud Infrastructure', '51-200', null, true, now()),
  ('b8c9d0e1-f2a3-4456-b789-0abcdef01234'::uuid, 'BioHealth Pipeline', 'biohealth-pipeline', 'https://biohealth.example', 'Healthcare', '11-50', null, true, now()),
  ('c9d0e1f2-a3b4-4567-c890-abcdef012345'::uuid, 'Fintech Architects', 'fintech-architects', 'https://fintecharch.example', 'Fintech', '51-200', null, true, now()),
  ('d0e1f2a3-b4c5-4678-d901-bcdef0123456'::uuid, 'Nexus Field Sales', 'nexus-field-sales', 'https://nexus.example', 'Telecommunications', '1001+', null, false, now())
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  website = excluded.website,
  industry = excluded.industry,
  company_size = excluded.company_size,
  setup_completed = excluded.setup_completed,
  updated_at = now();

-- Full membership matrix + pipeline stages: run scripts/seed_organization.py
insert into public.organization_members (organization_id, user_id, role)
select
  'a8414d8d-a9fd-4880-a557-01c9ef16046c'::uuid,
  u.id,
  case lower(u.email)
    when 'bhanushankar474@gmail.com' then 'owner'
    when 'jordan.lee@novacrm.dev' then 'admin'
    when 'dakota.price@novacrm.dev' then 'admin'
    when 'jamie.patel@novacrm.dev' then 'admin'
    when 'riley.chen@novacrm.dev' then 'admin'
    else 'member'
  end
from public.users u
where lower(u.email) = 'bhanushankar474@gmail.com'
   or u.email like '%@novacrm.dev'
on conflict (organization_id, user_id) do update set role = excluded.role;
