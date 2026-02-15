-- Backfill usage_tracking for existing auth users

begin;

insert into public.usage_tracking (
  user_id,
  billing_period_start,
  billing_period_end,
  tokens_used,
  competitor_gaps_used,
  rewrites_used,
  ai_cost_cents,
  updated_at
)
select
  u.id as user_id,
  now() as billing_period_start,
  now() + interval '30 days' as billing_period_end,
  0 as tokens_used,
  0 as competitor_gaps_used,
  0 as rewrites_used,
  0 as ai_cost_cents,
  now() as updated_at
from auth.users u
left join public.usage_tracking ut on ut.user_id = u.id
where ut.user_id is null;

commit;
