-- 024: Tier 1 hardening for atomic generate-token quota charging

begin;

create or replace function public.record_generate_usage(
  p_user_id uuid,
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
  v_token_limit bigint;
  v_tokens_to_add int := greatest(p_tokens, 0);
  v_cost_to_add int := greatest(p_cost_cents, 0);
begin
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
     and v_usage.tokens_used + v_tokens_to_add > v_token_limit then
    raise exception 'token_quota_exceeded';
  end if;

  update public.usage_tracking
  set tokens_used = tokens_used + v_tokens_to_add,
      ai_cost_cents = ai_cost_cents + v_cost_to_add,
      updated_at = now()
  where user_id = v_usage.user_id
    and billing_period_start = v_usage.billing_period_start
  returning *
    into v_usage;

  return next v_usage;
  return;
end;
$$;

grant execute on function public.record_generate_usage(uuid, int, int) to authenticated;

commit;
