-- 023: Tier 0 hardening for atomic report completion + charging

begin;

-- Re-assert idempotency uniqueness guard for report creation.
create unique index if not exists conversion_gap_reports_idempotency_key_unique_idx
  on public.conversion_gap_reports (user_id, report_type, idempotency_key)
  where idempotency_key is not null
    and length(trim(idempotency_key)) > 0;

create or replace function public.complete_gap_report_with_usage(
  p_user_id uuid,
  p_report_id uuid,
  p_competitor_data jsonb,
  p_gap_analysis jsonb,
  p_rewrites jsonb,
  p_tokens int,
  p_cost_cents int
)
returns setof public.usage_tracking
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report_status text;
  v_quota_charged boolean;
  v_usage public.usage_tracking%rowtype;
  v_plan text;
  v_status text;
  v_current_period_end timestamptz;
  v_gap_limit int;
begin
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

  select plan::text, status::text, current_period_end
    into v_plan, v_status, v_current_period_end
  from public.subscriptions
  where user_id = p_user_id;

  if v_plan is null then
    raise exception 'subscription_missing';
  end if;

  if v_status not in ('active', 'past_due') then
    raise exception 'subscription_not_entitled';
  end if;

  if v_status = 'past_due'
     and (
       v_current_period_end is null
       or v_current_period_end <= now()
     ) then
    raise exception 'subscription_grace_expired';
  end if;

  select competitor_gap_limit
    into v_gap_limit
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

  if v_gap_limit is not null and v_usage.competitor_gaps_used >= v_gap_limit then
    raise exception 'competitor_gap_quota_exceeded';
  end if;

  update public.usage_tracking
  set competitor_gaps_used = competitor_gaps_used + 1,
      tokens_used = tokens_used + greatest(p_tokens, 0),
      ai_cost_cents = ai_cost_cents + greatest(p_cost_cents, 0),
      updated_at = now()
  where user_id = v_usage.user_id
    and billing_period_start = v_usage.billing_period_start
  returning *
    into v_usage;

  update public.conversion_gap_reports
  set status = 'completed',
      competitor_data = coalesce(p_competitor_data, '{}'::jsonb),
      gap_analysis = coalesce(p_gap_analysis, '{}'::jsonb),
      rewrites = coalesce(p_rewrites, '{}'::jsonb),
      quota_charged = true
  where id = p_report_id
    and user_id = p_user_id
    and status = 'running';

  if not found then
    raise exception 'report_completion_failed';
  end if;

  return next v_usage;
  return;
end;
$$;

grant execute on function public.complete_gap_report_with_usage(uuid, uuid, jsonb, jsonb, jsonb, int, int) to authenticated;

create or replace function public.complete_snapshot_report_with_usage(
  p_user_id uuid,
  p_report_id uuid,
  p_snapshot_result jsonb,
  p_tokens int,
  p_cost_cents int
)
returns setof public.usage_tracking
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report_status text;
  v_quota_charged boolean;
  v_usage public.usage_tracking%rowtype;
  v_plan text;
  v_status text;
  v_current_period_end timestamptz;
begin
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

  select plan::text, status::text, current_period_end
    into v_plan, v_status, v_current_period_end
  from public.subscriptions
  where user_id = p_user_id;

  if v_plan is null then
    raise exception 'subscription_missing';
  end if;

  if v_status not in ('active', 'past_due') then
    raise exception 'subscription_not_entitled';
  end if;

  if v_status = 'past_due'
     and (
       v_current_period_end is null
       or v_current_period_end <= now()
     ) then
    raise exception 'subscription_grace_expired';
  end if;

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

  update public.usage_tracking
  set tokens_used = tokens_used + greatest(p_tokens, 0),
      ai_cost_cents = ai_cost_cents + greatest(p_cost_cents, 0),
      updated_at = now()
  where user_id = v_usage.user_id
    and billing_period_start = v_usage.billing_period_start
  returning *
    into v_usage;

  update public.conversion_gap_reports
  set status = 'completed',
      snapshot_result = coalesce(p_snapshot_result, '{}'::jsonb),
      quota_charged = true
  where id = p_report_id
    and user_id = p_user_id
    and status = 'running';

  if not found then
    raise exception 'report_completion_failed';
  end if;

  return next v_usage;
  return;
end;
$$;

grant execute on function public.complete_snapshot_report_with_usage(uuid, uuid, jsonb, int, int) to authenticated;

commit;
