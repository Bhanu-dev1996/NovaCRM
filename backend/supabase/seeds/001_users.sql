-- Demo users for NovaCRM (29 total).
-- Prefer: python backend/scripts/seed_users.py
-- Password for all seed users: Password123!

insert into public.users (
  email, name, password_hash, email_verified, job_role, updated_at
)
values
  ('alex.morgan@novacrm.dev', 'Alex Morgan', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Account Executive', now()),
  ('jordan.lee@novacrm.dev', 'Jordan Lee', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Sales Manager', now()),
  ('sam.rivera@novacrm.dev', 'Sam Rivera', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'SDR', now()),
  ('casey.nguyen@novacrm.dev', 'Casey Nguyen', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Customer Success', now()),
  ('riley.chen@novacrm.dev', 'Riley Chen', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'RevOps', now()),
  ('taylor.brooks@novacrm.dev', 'Taylor Brooks', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Account Executive', now()),
  ('morgan.hayes@novacrm.dev', 'Morgan Hayes', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'SDR', now()),
  ('jamie.patel@novacrm.dev', 'Jamie Patel', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Sales Manager', now()),
  ('avery.collins@novacrm.dev', 'Avery Collins', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Customer Success', now()),
  ('cameron.diaz@novacrm.dev', 'Cameron Diaz', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Account Executive', now()),
  ('quinn.foster@novacrm.dev', 'Quinn Foster', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Marketing', now()),
  ('drew.bennett@novacrm.dev', 'Drew Bennett', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'BDR', now()),
  ('parker.singh@novacrm.dev', 'Parker Singh', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Account Executive', now()),
  ('reese.owens@novacrm.dev', 'Reese Owens', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Support', now()),
  ('blake.martin@novacrm.dev', 'Blake Martin', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Sales Engineer', now()),
  ('skyler.adams@novacrm.dev', 'Skyler Adams', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'SDR', now()),
  ('finley.ross@novacrm.dev', 'Finley Ross', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'RevOps', now()),
  ('harper.kim@novacrm.dev', 'Harper Kim', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Customer Success', now()),
  ('rowan.baker@novacrm.dev', 'Rowan Baker', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Account Executive', now()),
  ('sage.turner@novacrm.dev', 'Sage Turner', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Product Marketing', now()),
  ('dakota.price@novacrm.dev', 'Dakota Price', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Sales Manager', now()),
  ('emerson.ward@novacrm.dev', 'Emerson Ward', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'BDR', now()),
  ('phoenix.reed@novacrm.dev', 'Phoenix Reed', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Account Executive', now()),
  ('kennedy.lopez@novacrm.dev', 'Kennedy Lopez', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Customer Success', now()),
  ('logan.mitchell@novacrm.dev', 'Logan Mitchell', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'SDR', now()),
  ('charlie.nguyen@novacrm.dev', 'Charlie Nguyen', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Support', now()),
  ('jordan.wright@novacrm.dev', 'Jordan Wright', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Sales Engineer', now()),
  ('nina.volkov@novacrm.dev', 'Nina Volkov', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Account Executive', now()),
  ('omar.hassan@novacrm.dev', 'Omar Hassan', '$2b$12$C3JWXmCgowRhAQP22RZxre96U6PWXFreJCR4BlEmgbhSCEdmckhMO', true, 'Customer Success', now())
on conflict (email) do update set
  name = excluded.name,
  password_hash = excluded.password_hash,
  email_verified = true,
  job_role = excluded.job_role,
  verification_token = null,
  verification_expires_at = null,
  updated_at = now();
