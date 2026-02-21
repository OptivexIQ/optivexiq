begin;

update public.saas_profiles
set acv_range = null
where acv_range is not null
  and acv_range not in ('lt_10k', '10k_50k', '50k_150k', '150k_500k', 'gte_500k');

update public.saas_profiles
set revenue_stage = null
where revenue_stage is not null
  and revenue_stage not in ('pre', 'lt_10k', '10k_50k', 'gte_50k');

update public.saas_profiles
set conversion_goal = null
where conversion_goal is not null
  and conversion_goal not in ('demo', 'trial', 'paid', 'educate');

alter table public.saas_profiles
  drop constraint if exists saas_profiles_acv_range_enum_check;
alter table public.saas_profiles
  add constraint saas_profiles_acv_range_enum_check
  check (
    acv_range is null
    or acv_range in ('lt_10k', '10k_50k', '50k_150k', '150k_500k', 'gte_500k')
  );

alter table public.saas_profiles
  drop constraint if exists saas_profiles_revenue_stage_enum_check;
alter table public.saas_profiles
  add constraint saas_profiles_revenue_stage_enum_check
  check (
    revenue_stage is null
    or revenue_stage in ('pre', 'lt_10k', '10k_50k', 'gte_50k')
  );

alter table public.saas_profiles
  drop constraint if exists saas_profiles_conversion_goal_enum_check;
alter table public.saas_profiles
  add constraint saas_profiles_conversion_goal_enum_check
  check (
    conversion_goal is null
    or conversion_goal in ('demo', 'trial', 'paid', 'educate')
  );

commit;
