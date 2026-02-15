-- 027: Restrict direct authenticated RPC mutation access and tighten entitlement probes

begin;

create or replace function public.resolve_entitled_subscription(
  p_user_id uuid
)
returns table(plan text, billing text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_status text;
  v_current_period_end timestamptz;
  v_billing text;
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is distinct from p_user_id then
    raise exception 'forbidden';
  end if;

  select s.plan::text, s.status::text, s.current_period_end, p.billing::text
    into v_plan, v_status, v_current_period_end, v_billing
  from public.subscriptions s
  left join public.plan_limits p
    on p.plan::text = s.plan::text
  where s.user_id = p_user_id;

  if v_plan is null then
    raise exception 'subscription_missing';
  end if;

  if v_billing is null then
    raise exception 'plan_limits_missing';
  end if;

  if v_billing = 'one_time' then
    if v_status <> 'active' then
      raise exception 'subscription_not_entitled';
    end if;
  else
    if v_status <> 'active' then
      raise exception 'subscription_not_entitled';
    end if;

    if v_current_period_end is null or v_current_period_end <= now() then
      raise exception 'subscription_expired';
    end if;
  end if;

  plan := v_plan;
  billing := v_billing;
  return next;
end;
$$;

create or replace function public.can_create_gap_report(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_plan text;
  v_billing text;
  v_gap_limit int;
  v_used int;
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is distinct from p_user_id then
    return false;
  end if;

  select plan, billing
    into v_plan, v_billing
  from public.resolve_entitled_subscription(p_user_id);

  if v_billing is null then
    return false;
  end if;

  select competitor_gap_limit
    into v_gap_limit
  from public.plan_limits
  where plan::text = v_plan;

  if v_gap_limit is null then
    return true;
  end if;

  select coalesce(sum(competitor_gaps_used), 0)
    into v_used
  from public.usage_tracking
  where user_id = p_user_id
    and now() >= billing_period_start
    and now() < billing_period_end;

  return v_used < v_gap_limit;
exception
  when others then
    return false;
end;
$$;

revoke execute on function public.resolve_entitled_subscription(uuid) from authenticated;
grant execute on function public.resolve_entitled_subscription(uuid) to service_role;

grant execute on function public.can_create_gap_report(uuid) to authenticated;
grant execute on function public.can_create_gap_report(uuid) to service_role;

revoke execute on function public.record_generate_usage(uuid, int, int) from authenticated;
revoke execute on function public.record_gap_report_usage(uuid, uuid, int, int) from authenticated;
revoke execute on function public.complete_gap_report_with_usage(uuid, uuid, jsonb, jsonb, jsonb, int, int) from authenticated;
revoke execute on function public.complete_snapshot_report_with_usage(uuid, uuid, jsonb, int, int) from authenticated;
revoke execute on function public.reserve_generate_usage(uuid, text, int, int) from authenticated;
revoke execute on function public.finalize_generate_usage(uuid, text, int, int) from authenticated;
revoke execute on function public.rollback_generate_usage(uuid, text) from authenticated;
revoke execute on function public.reserve_gap_report_quota(uuid, uuid, text) from authenticated;
revoke execute on function public.rollback_gap_report_quota_reservation(uuid, text) from authenticated;
revoke execute on function public.complete_gap_report_with_reserved_usage(uuid, uuid, text, jsonb, jsonb, jsonb, int, int) from authenticated;
revoke execute on function public.increment_usage_tokens(uuid, int, int) from authenticated;
revoke execute on function public.increment_gap_reports(uuid) from authenticated;
revoke execute on function public.increment_competitor_gaps(uuid) from authenticated;
revoke execute on function public.increment_rewrites(uuid) from authenticated;

grant execute on function public.record_generate_usage(uuid, int, int) to service_role;
grant execute on function public.record_gap_report_usage(uuid, uuid, int, int) to service_role;
grant execute on function public.complete_gap_report_with_usage(uuid, uuid, jsonb, jsonb, jsonb, int, int) to service_role;
grant execute on function public.complete_snapshot_report_with_usage(uuid, uuid, jsonb, int, int) to service_role;
grant execute on function public.reserve_generate_usage(uuid, text, int, int) to service_role;
grant execute on function public.finalize_generate_usage(uuid, text, int, int) to service_role;
grant execute on function public.rollback_generate_usage(uuid, text) to service_role;
grant execute on function public.reserve_gap_report_quota(uuid, uuid, text) to service_role;
grant execute on function public.rollback_gap_report_quota_reservation(uuid, text) to service_role;
grant execute on function public.complete_gap_report_with_reserved_usage(uuid, uuid, text, jsonb, jsonb, jsonb, int, int) to service_role;
grant execute on function public.increment_usage_tokens(uuid, int, int) to service_role;
grant execute on function public.increment_gap_reports(uuid) to service_role;
grant execute on function public.increment_competitor_gaps(uuid) to service_role;
grant execute on function public.increment_rewrites(uuid) to service_role;

commit;
