-- 028: Development entitlement + quota simulation helpers
-- Purpose: simulate paid subscription and quota pressure for end-to-end AI feature testing.
-- Notes:
-- 1) Replace 'your-dev-user@example.com' before running.
-- 2) Run blocks intentionally based on the scenario you are testing.

/*
========================================
A) Seed paid entitlement + usage window
========================================
*/

begin;

with target_user as (
  select id as user_id
  from auth.users
  where email = 'your-dev-user@example.com'
  limit 1
),
upsert_subscription as (
  insert into public.subscriptions (
    user_id,
    plan,
    status,
    is_recurring,
    current_period_end,
    lemonsqueezy_subscription_id,
    lemonsqueezy_customer_id,
    updated_at
  )
  select
    tu.user_id,
    'pro',
    'active',
    true,
    now() + interval '30 days',
    null,
    null,
    now()
  from target_user tu
  on conflict (user_id) do update
    set plan = excluded.plan,
        status = excluded.status,
        is_recurring = excluded.is_recurring,
        current_period_end = excluded.current_period_end,
        updated_at = now()
  returning user_id
)
insert into public.usage_tracking (
  user_id,
  billing_period_start,
  billing_period_end,
  competitor_gaps_used,
  tokens_used,
  ai_cost_cents,
  updated_at
)
select
  us.user_id,
  date_trunc('day', now()),
  date_trunc('day', now()) + interval '30 days',
  0,
  0,
  0,
  now()
from upsert_subscription us
on conflict (user_id, billing_period_start, billing_period_end) do update
  set updated_at = now();

commit;

/*
========================================
B) Lifecycle state simulation
========================================
*/

-- Past due with grace window still valid.
update public.subscriptions
set status = 'past_due',
    current_period_end = now() + interval '3 days',
    updated_at = now()
where user_id = (
  select id from auth.users where email = 'your-dev-user@example.com' limit 1
);

-- Past due with grace window expired.
update public.subscriptions
set status = 'past_due',
    current_period_end = now() - interval '1 minute',
    updated_at = now()
where user_id = (
  select id from auth.users where email = 'your-dev-user@example.com' limit 1
);

/*
========================================
C) Quota pressure scenario: 1 remaining
========================================
*/

begin;

with target_user as (
  select id as user_id
  from auth.users
  where email = 'your-dev-user@example.com'
  limit 1
),
user_plan as (
  select
    s.user_id,
    s.plan::text as plan_key
  from public.subscriptions s
  join target_user tu on tu.user_id = s.user_id
  limit 1
),
limits as (
  select
    pl.plan::text as plan_key,
    pl.token_limit,
    pl.competitor_gap_limit
  from public.plan_limits pl
  join user_plan up on up.plan_key = pl.plan::text
  limit 1
),
current_usage_row as (
  select
    ut.user_id,
    ut.billing_period_start,
    ut.billing_period_end
  from public.usage_tracking ut
  join target_user tu on tu.user_id = ut.user_id
  where now() >= ut.billing_period_start
    and now() < ut.billing_period_end
  order by ut.billing_period_start desc
  limit 1
)
update public.usage_tracking ut
set
  tokens_used = case
    when l.token_limit is null then ut.tokens_used
    when l.token_limit <= 0 then 0
    else greatest(l.token_limit - 1, 0)
  end,
  competitor_gaps_used = case
    when l.competitor_gap_limit is null then ut.competitor_gaps_used
    when l.competitor_gap_limit <= 0 then 0
    else greatest(l.competitor_gap_limit - 1, 0)
  end,
  updated_at = now()
from current_usage_row cur
cross join limits l
where ut.user_id = cur.user_id
  and ut.billing_period_start = cur.billing_period_start
  and ut.billing_period_end = cur.billing_period_end;

commit;

/*
========================================
D) Quota pressure scenario: at limit
========================================
*/

begin;

with target_user as (
  select id as user_id
  from auth.users
  where email = 'your-dev-user@example.com'
  limit 1
),
user_plan as (
  select s.user_id, s.plan::text as plan_key
  from public.subscriptions s
  join target_user tu on tu.user_id = s.user_id
  limit 1
),
limits as (
  select
    pl.plan::text as plan_key,
    pl.token_limit,
    pl.competitor_gap_limit
  from public.plan_limits pl
  join user_plan up on up.plan_key = pl.plan::text
  limit 1
),
current_usage_row as (
  select ut.user_id, ut.billing_period_start, ut.billing_period_end
  from public.usage_tracking ut
  join target_user tu on tu.user_id = ut.user_id
  where now() >= ut.billing_period_start
    and now() < ut.billing_period_end
  order by ut.billing_period_start desc
  limit 1
)
update public.usage_tracking ut
set
  tokens_used = case
    when l.token_limit is null then ut.tokens_used
    else greatest(l.token_limit, 0)
  end,
  competitor_gaps_used = case
    when l.competitor_gap_limit is null then ut.competitor_gaps_used
    else greatest(l.competitor_gap_limit, 0)
  end,
  updated_at = now()
from current_usage_row cur
cross join limits l
where ut.user_id = cur.user_id
  and ut.billing_period_start = cur.billing_period_start
  and ut.billing_period_end = cur.billing_period_end;

commit;

/*
========================================
E) Reset usage to zero for retest
========================================
*/

begin;

update public.usage_tracking
set
  tokens_used = 0,
  competitor_gaps_used = 0,
  ai_cost_cents = 0,
  updated_at = now()
where user_id = (
  select id from auth.users where email = 'your-dev-user@example.com' limit 1
)
and now() >= billing_period_start
and now() < billing_period_end;

commit;

/*
========================================
F) Validation query
========================================
*/

select
  s.user_id,
  s.plan,
  s.status,
  s.is_recurring,
  s.current_period_end,
  ut.billing_period_start,
  ut.billing_period_end,
  ut.competitor_gaps_used,
  ut.tokens_used,
  ut.ai_cost_cents,
  pl.competitor_gap_limit,
  pl.token_limit
from public.subscriptions s
left join public.usage_tracking ut
  on ut.user_id = s.user_id
 and now() >= ut.billing_period_start
 and now() < ut.billing_period_end
left join public.plan_limits pl
  on pl.plan::text = s.plan::text
where s.user_id = (
  select id from auth.users where email = 'your-dev-user@example.com' limit 1
);