-- 025: Tier 0 quota reservation + checkout session RLS hardening

begin;

create table if not exists public.usage_reservations (
  reservation_key text primary key,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  usage_kind text not null
    check (usage_kind in ('generate', 'gap_report', 'snapshot')),
  report_id uuid references public.conversion_gap_reports(id) on delete cascade,
  reserved_tokens int not null default 0,
  reserved_cost_cents int not null default 0,
  reserved_gap_reports int not null default 0,
  status text not null default 'reserved'
    check (status in ('reserved', 'committed', 'released')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists usage_reservations_user_status_idx
  on public.usage_reservations (user_id, status, usage_kind, created_at desc);

create or replace function public.reserve_generate_usage(
  p_user_id uuid,
  p_reservation_key text,
  p_reserved_tokens int,
  p_reserved_cost_cents int
)
returns setof public.usage_tracking
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage public.usage_tracking%rowtype;
  v_existing public.usage_reservations%rowtype;
  v_plan text;
  v_status text;
  v_current_period_end timestamptz;
  v_token_limit bigint;
  v_tokens_to_reserve int := greatest(p_reserved_tokens, 0);
  v_cost_to_reserve int := greatest(p_reserved_cost_cents, 0);
begin
  if p_reservation_key is null or length(trim(p_reservation_key)) = 0 then
    raise exception 'invalid_reservation_key';
  end if;

  select *
    into v_existing
  from public.usage_reservations
  where reservation_key = p_reservation_key
  for update;

  if found then
    if v_existing.user_id <> p_user_id then
      raise exception 'reservation_user_mismatch';
    end if;

    if v_existing.status in ('reserved', 'committed') then
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

    raise exception 'reservation_released';
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

  if v_token_limit is not null
     and v_usage.tokens_used + v_tokens_to_reserve > v_token_limit then
    raise exception 'token_quota_exceeded';
  end if;

  update public.usage_tracking
  set tokens_used = tokens_used + v_tokens_to_reserve,
      ai_cost_cents = ai_cost_cents + v_cost_to_reserve,
      updated_at = now()
  where user_id = v_usage.user_id
    and billing_period_start = v_usage.billing_period_start
  returning *
    into v_usage;

  insert into public.usage_reservations (
    reservation_key,
    user_id,
    usage_kind,
    reserved_tokens,
    reserved_cost_cents,
    status,
    updated_at
  )
  values (
    p_reservation_key,
    p_user_id,
    'generate',
    v_tokens_to_reserve,
    v_cost_to_reserve,
    'reserved',
    now()
  );

  return next v_usage;
  return;
end;
$$;

grant execute on function public.reserve_generate_usage(uuid, text, int, int) to authenticated;

create or replace function public.finalize_generate_usage(
  p_user_id uuid,
  p_reservation_key text,
  p_actual_tokens int,
  p_actual_cost_cents int
)
returns setof public.usage_tracking
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage public.usage_tracking%rowtype;
  v_reservation public.usage_reservations%rowtype;
  v_plan text;
  v_status text;
  v_current_period_end timestamptz;
  v_token_limit bigint;
  v_delta_tokens int;
  v_delta_cost int;
  v_tokens int := greatest(p_actual_tokens, 0);
  v_cost int := greatest(p_actual_cost_cents, 0);
begin
  select *
    into v_reservation
  from public.usage_reservations
  where reservation_key = p_reservation_key
    and usage_kind = 'generate'
  for update;

  if not found then
    raise exception 'reservation_missing';
  end if;

  if v_reservation.user_id <> p_user_id then
    raise exception 'reservation_user_mismatch';
  end if;

  if v_reservation.status = 'released' then
    raise exception 'reservation_released';
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

  v_delta_tokens := v_tokens - coalesce(v_reservation.reserved_tokens, 0);
  v_delta_cost := v_cost - coalesce(v_reservation.reserved_cost_cents, 0);

  if v_delta_tokens > 0
     and v_token_limit is not null
     and v_usage.tokens_used + v_delta_tokens > v_token_limit then
    raise exception 'token_quota_exceeded';
  end if;

  update public.usage_tracking
  set tokens_used = greatest(tokens_used + v_delta_tokens, 0),
      ai_cost_cents = greatest(ai_cost_cents + v_delta_cost, 0),
      updated_at = now()
  where user_id = v_usage.user_id
    and billing_period_start = v_usage.billing_period_start
  returning *
    into v_usage;

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

grant execute on function public.finalize_generate_usage(uuid, text, int, int) to authenticated;

create or replace function public.rollback_generate_usage(
  p_user_id uuid,
  p_reservation_key text
)
returns setof public.usage_tracking
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage public.usage_tracking%rowtype;
  v_reservation public.usage_reservations%rowtype;
begin
  select *
    into v_reservation
  from public.usage_reservations
  where reservation_key = p_reservation_key
    and usage_kind = 'generate'
  for update;

  if not found then
    raise exception 'reservation_missing';
  end if;

  if v_reservation.user_id <> p_user_id then
    raise exception 'reservation_user_mismatch';
  end if;

  if v_reservation.status = 'released' then
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

  if v_reservation.status = 'committed' then
    raise exception 'reservation_already_committed';
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
  set tokens_used = greatest(tokens_used - coalesce(v_reservation.reserved_tokens, 0), 0),
      ai_cost_cents = greatest(ai_cost_cents - coalesce(v_reservation.reserved_cost_cents, 0), 0),
      updated_at = now()
  where user_id = v_usage.user_id
    and billing_period_start = v_usage.billing_period_start
  returning *
    into v_usage;

  update public.usage_reservations
  set status = 'released',
      updated_at = now()
  where reservation_key = p_reservation_key;

  return next v_usage;
  return;
end;
$$;

grant execute on function public.rollback_generate_usage(uuid, text) to authenticated;

create or replace function public.reserve_gap_report_quota(
  p_user_id uuid,
  p_report_id uuid,
  p_reservation_key text
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
  v_status text;
  v_current_period_end timestamptz;
  v_gap_limit int;
begin
  if p_reservation_key is null or length(trim(p_reservation_key)) = 0 then
    raise exception 'invalid_reservation_key';
  end if;

  select *
    into v_reservation
  from public.usage_reservations
  where reservation_key = p_reservation_key
  for update;

  if found then
    if v_reservation.user_id <> p_user_id then
      raise exception 'reservation_user_mismatch';
    end if;

    if v_reservation.status in ('reserved', 'committed') then
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
      updated_at = now()
  where user_id = v_usage.user_id
    and billing_period_start = v_usage.billing_period_start
  returning *
    into v_usage;

  insert into public.usage_reservations (
    reservation_key,
    user_id,
    usage_kind,
    report_id,
    reserved_gap_reports,
    status,
    updated_at
  )
  values (
    p_reservation_key,
    p_user_id,
    'gap_report',
    p_report_id,
    1,
    'reserved',
    now()
  );

  return next v_usage;
  return;
end;
$$;

grant execute on function public.reserve_gap_report_quota(uuid, uuid, text) to authenticated;

create or replace function public.rollback_gap_report_quota_reservation(
  p_user_id uuid,
  p_reservation_key text
)
returns setof public.usage_tracking
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage public.usage_tracking%rowtype;
  v_reservation public.usage_reservations%rowtype;
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

  if v_reservation.status = 'released' then
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

  if v_reservation.status = 'committed' then
    raise exception 'reservation_already_committed';
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
  set competitor_gaps_used = greatest(
        competitor_gaps_used - coalesce(v_reservation.reserved_gap_reports, 0),
        0
      ),
      updated_at = now()
  where user_id = v_usage.user_id
    and billing_period_start = v_usage.billing_period_start
  returning *
    into v_usage;

  update public.usage_reservations
  set status = 'released',
      updated_at = now()
  where reservation_key = p_reservation_key;

  return next v_usage;
  return;
end;
$$;

grant execute on function public.rollback_gap_report_quota_reservation(uuid, text) to authenticated;

create or replace function public.complete_gap_report_with_reserved_usage(
  p_user_id uuid,
  p_report_id uuid,
  p_reservation_key text,
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
  v_usage public.usage_tracking%rowtype;
  v_reservation public.usage_reservations%rowtype;
  v_report_status text;
  v_quota_charged boolean;
  v_plan text;
  v_status text;
  v_current_period_end timestamptz;
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

grant execute on function public.complete_gap_report_with_reserved_usage(uuid, uuid, text, jsonb, jsonb, jsonb, int, int) to authenticated;

alter table if exists public.billing_checkout_sessions enable row level security;

drop policy if exists billing_checkout_sessions_select_own on public.billing_checkout_sessions;
create policy billing_checkout_sessions_select_own
  on public.billing_checkout_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists billing_checkout_sessions_insert_own on public.billing_checkout_sessions;
create policy billing_checkout_sessions_insert_own
  on public.billing_checkout_sessions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists billing_checkout_sessions_update_own on public.billing_checkout_sessions;
create policy billing_checkout_sessions_update_own
  on public.billing_checkout_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists billing_checkout_sessions_delete_own on public.billing_checkout_sessions;
create policy billing_checkout_sessions_delete_own
  on public.billing_checkout_sessions
  for delete
  using (auth.uid() = user_id);

commit;
