-- 019: Tier 1 revenue hardening (idempotency, atomic quota, lifecycle states)

begin;

alter table public.conversion_gap_reports
  add column if not exists idempotency_key text,
  add column if not exists quota_charged boolean not null default false;

update public.conversion_gap_reports
set idempotency_key = nullif(competitor_data->>'idempotency_key', '')
where idempotency_key is null
  and competitor_data ? 'idempotency_key';

with ranked_idempotency as (
  select
    id,
    row_number() over (
      partition by user_id, report_type, idempotency_key
      order by created_at desc, id desc
    ) as rn
  from public.conversion_gap_reports
  where idempotency_key is not null
    and length(trim(idempotency_key)) > 0
)
update public.conversion_gap_reports reports
set idempotency_key = null
from ranked_idempotency ranked
where reports.id = ranked.id
  and ranked.rn > 1;

drop index if exists public.conversion_gap_reports_idempotency_key_idx;

create unique index if not exists conversion_gap_reports_idempotency_key_unique_idx
  on public.conversion_gap_reports (user_id, report_type, idempotency_key)
  where idempotency_key is not null
    and length(trim(idempotency_key)) > 0;

do $$
begin
  if exists (
    select 1
    from pg_type
    where typname = 'subscription_status'
      and typtype = 'e'
  ) then
    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'subscription_status'
        and e.enumlabel = 'canceled'
    ) then
      alter type public.subscription_status add value 'canceled';
    end if;

    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'subscription_status'
        and e.enumlabel = 'expired'
    ) then
      alter type public.subscription_status add value 'expired';
    end if;
  end if;
end $$;

create or replace function public.record_gap_report_usage(
  p_user_id uuid,
  p_report_id uuid,
  p_tokens int,
  p_cost_cents int
)
returns setof public.usage_tracking
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage public.usage_tracking%rowtype;
  v_plan text;
  v_status text;
  v_current_period_end timestamptz;
  v_gap_limit int;
  v_quota_charged boolean;
begin
  select quota_charged
    into v_quota_charged
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
  set quota_charged = true
  where id = p_report_id
    and user_id = p_user_id;

  return next v_usage;
  return;
end;
$$;

grant execute on function public.record_gap_report_usage(uuid, uuid, int, int) to authenticated;

commit;
