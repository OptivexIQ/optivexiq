-- 004: Plan enforcement function and RLS policies

begin;

create or replace function public.can_create_gap_report(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_plan text;
  v_status text;
  v_gap_limit int;
  v_used int;
begin
  select plan, status
    into v_plan, v_status
  from public.subscriptions
  where user_id = p_user_id;

  if v_plan is null then
    v_plan := 'free';
  end if;

  if v_status is null then
    v_status := 'inactive';
  end if;

  if v_plan <> 'free' and v_status <> 'active' then
    return false;
  end if;

  select gap_reports_limit
    into v_gap_limit
  from public.plan_limits
  where plan = v_plan;

  if v_gap_limit is null then
    return false;
  end if;

  select coalesce(sum(competitor_gaps_used), 0)
    into v_used
  from public.usage_tracking
  where user_id = p_user_id
    and now() >= billing_period_start
    and now() < billing_period_end;

  return v_used < v_gap_limit;
end;
$$;

grant execute on function public.can_create_gap_report(uuid) to authenticated;

alter table public.user_profiles enable row level security;
alter table public.saas_profiles enable row level security;
alter table public.conversion_gap_reports enable row level security;
alter table public.usage_tracking enable row level security;
alter table public.subscriptions enable row level security;

create policy users_select_own
  on public.user_profiles
  for select
  using (auth.uid() = id);

create policy users_insert_own
  on public.user_profiles
  for insert
  with check (auth.uid() = id);

create policy users_update_own
  on public.user_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy saas_profiles_select_own
  on public.saas_profiles
  for select
  using (auth.uid() = user_id);

create policy saas_profiles_insert_own
  on public.saas_profiles
  for insert
  with check (auth.uid() = user_id);

create policy saas_profiles_update_own
  on public.saas_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy conversion_gap_reports_select_own
  on public.conversion_gap_reports
  for select
  using (auth.uid() = user_id);

create policy conversion_gap_reports_insert_own
  on public.conversion_gap_reports
  for insert
  with check (
    auth.uid() = user_id
    and public.can_create_gap_report(user_id)
  );

create policy usage_tracking_select_own
  on public.usage_tracking
  for select
  using (auth.uid() = user_id);

create policy subscriptions_select_own
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

commit;
