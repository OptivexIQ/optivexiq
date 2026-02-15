-- 033: Stabilize canonical completion RPC shape after migration-order drift

begin;

-- Remove legacy overload if it exists so PostgREST/RPC resolution is deterministic.
drop function if exists public.complete_gap_report_with_reserved_usage(
  uuid,
  uuid,
  text,
  jsonb,
  jsonb,
  jsonb,
  int,
  int
);

-- Recreate canonical function with report_data payload support.
create or replace function public.complete_gap_report_with_reserved_usage(
  p_user_id uuid,
  p_report_id uuid,
  p_reservation_key text,
  p_competitor_data jsonb,
  p_gap_analysis jsonb,
  p_rewrites jsonb,
  p_tokens int,
  p_cost_cents int,
  p_report_data jsonb default null
)
returns setof public.usage_tracking
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage public.usage_tracking%rowtype;
  v_reservation public.usage_reservations%rowtype;
  v_report_status text;
  v_quota_charged boolean;
  v_plan text;
  v_token_limit bigint;
  v_tokens int := greatest(p_tokens, 0);
  v_cost int := greatest(p_cost_cents, 0);
begin
  select *
    into v_reservation
  from public.usage_reservations
  where reservation_key = p_reservation_key
    and usage_kind = 'gap_report'
  for update;

  if not found then
    raise exception 'reservation_missing';
  end if;

  if v_reservation.user_id <> p_user_id then
    raise exception 'reservation_user_mismatch';
  end if;

  if v_reservation.report_id is distinct from p_report_id then
    raise exception 'reservation_report_mismatch';
  end if;

  if v_reservation.status = 'released' then
    raise exception 'reservation_released';
  end if;

  select status, quota_charged
    into v_report_status, v_quota_charged
  from public.conversion_gap_reports
  where id = p_report_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'report_not_found';
  end if;

  if coalesce(v_quota_charged, false) then
    select *
      into v_usage
    from public.usage_tracking
    where user_id = p_user_id
      and now() >= billing_period_start
      and now() < billing_period_end
    order by billing_period_start desc
    limit 1;

    if not found then
      raise exception 'usage_record_missing';
    end if;

    return next v_usage;
    return;
  end if;

  if v_report_status <> 'running' then
    raise exception 'report_not_running';
  end if;

  select plan
    into v_plan
  from public.resolve_entitled_subscription(p_user_id);

  select token_limit
    into v_token_limit
  from public.plan_limits
  where plan::text = v_plan;

  select *
    into v_usage
  from public.usage_tracking
  where user_id = p_user_id
    and now() >= billing_period_start
    and now() < billing_period_end
  order by billing_period_start desc
  limit 1
  for update;

  if not found then
    raise exception 'usage_record_missing';
  end if;

  if v_token_limit is not null and v_usage.tokens_used + v_tokens > v_token_limit then
    raise exception 'token_quota_exceeded';
  end if;

  update public.usage_tracking
  set tokens_used = tokens_used + v_tokens,
      ai_cost_cents = ai_cost_cents + v_cost,
      updated_at = now()
  where user_id = v_usage.user_id
    and billing_period_start = v_usage.billing_period_start
  returning *
    into v_usage;

  update public.conversion_gap_reports
  set status = 'completed',
      competitor_data = coalesce(p_competitor_data, competitor_data, '{}'::jsonb),
      report_data = coalesce(p_report_data, report_data, '{}'::jsonb),
      quota_charged = true
  where id = p_report_id
    and user_id = p_user_id
    and status = 'running';

  if not found then
    raise exception 'report_completion_failed';
  end if;

  update public.usage_reservations
  set status = 'committed',
      reserved_tokens = v_tokens,
      reserved_cost_cents = v_cost,
      updated_at = now()
  where reservation_key = p_reservation_key;

  return next v_usage;
  return;
end;
$$;

-- Keep direct mutation RPCs inaccessible to authenticated role.
revoke execute on function public.complete_gap_report_with_reserved_usage(
  uuid,
  uuid,
  text,
  jsonb,
  jsonb,
  jsonb,
  int,
  int,
  jsonb
) from authenticated;

grant execute on function public.complete_gap_report_with_reserved_usage(
  uuid,
  uuid,
  text,
  jsonb,
  jsonb,
  jsonb,
  int,
  int,
  jsonb
) to service_role;

commit;

