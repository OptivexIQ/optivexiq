-- 013: Expand usage_tracking counters for new quotas

begin;

alter table public.usage_tracking
  add column if not exists competitor_gaps_used int not null default 0,
  add column if not exists rewrites_used int not null default 0,
  add column if not exists ai_cost_cents int not null default 0,
  add column if not exists updated_at timestamptz not null default now();

commit;
