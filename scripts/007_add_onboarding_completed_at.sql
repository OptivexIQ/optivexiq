-- 007: Add onboarding completion tracking

begin;

alter table public.saas_profiles
  add column if not exists onboarding_completed_at timestamptz;

commit;
