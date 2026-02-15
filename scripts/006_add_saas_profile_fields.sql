-- 006: Add onboarding fields to saas_profiles

begin;

alter table public.saas_profiles
  add column if not exists key_objections jsonb not null default '[]'::jsonb,
  add column if not exists proof_points jsonb not null default '[]'::jsonb,
  add column if not exists differentiation_matrix jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

commit;
