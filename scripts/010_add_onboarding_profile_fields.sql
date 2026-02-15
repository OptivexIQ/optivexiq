-- 010: Add onboarding profile fields and progress tracking

begin;

alter table public.saas_profiles
  add column if not exists conversion_goal text,
  add column if not exists revenue_stage text,
  add column if not exists primary_pain text,
  add column if not exists buying_trigger text,
  add column if not exists website_url text,
  add column if not exists onboarding_progress integer not null default 0,
  add column if not exists onboarding_completed boolean not null default false;

do $$
begin
  if exists (
    select 1
    from public.saas_profiles
    where conversion_goal is null
       or revenue_stage is null
       or primary_pain is null
       or buying_trigger is null
       or website_url is null
  ) then
    raise exception 'Backfill required: onboarding fields cannot be null.';
  end if;
end $$;

alter table public.saas_profiles
  alter column conversion_goal set not null,
  alter column revenue_stage set not null,
  alter column primary_pain set not null,
  alter column buying_trigger set not null,
  alter column website_url set not null;

commit;
