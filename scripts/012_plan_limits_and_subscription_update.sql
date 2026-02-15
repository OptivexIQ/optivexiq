-- ============================================================
-- 012: Safe plan/subscription schema expansion (non-destructive)
-- ============================================================

begin;

-- Enum types are additive and idempotent.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_type') then
    create type plan_type as enum ('starter', 'pro', 'growth');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type subscription_status as enum ('active', 'inactive', 'cancelled', 'past_due');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'quota_window') then
    create type quota_window as enum ('lifetime', 'billing_period');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'billing_type') then
    create type billing_type as enum ('one_time', 'monthly');
  end if;
end $$;

-- Ensure plan_limits exists, then evolve in place.
create table if not exists public.plan_limits (
  plan text primary key,
  gap_reports_limit int,
  token_limit bigint
);

alter table public.plan_limits
  add column if not exists billing billing_type,
  add column if not exists rewrite_limit integer,
  add column if not exists rewrite_window quota_window,
  add column if not exists competitor_gap_limit integer,
  add column if not exists competitor_gap_window quota_window,
  add column if not exists token_window quota_window,
  add column if not exists team_member_limit integer,
  add column if not exists created_at timestamptz;

-- Backfill from legacy shape when present.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'plan_limits'
      and column_name = 'gap_reports_limit'
  ) then
    update public.plan_limits
    set competitor_gap_limit = coalesce(competitor_gap_limit, gap_reports_limit);
  end if;
end $$;

update public.plan_limits
set billing = coalesce(
      billing,
      case
        when plan::text in ('pro', 'growth') then 'monthly'::billing_type
        else 'one_time'::billing_type
      end
    ),
    rewrite_limit = coalesce(
      rewrite_limit,
      case
        when plan::text = 'starter' then 2
        when plan::text in ('pro', 'growth') then null
        else 2
      end
    ),
    rewrite_window = coalesce(
      rewrite_window,
      case
        when plan::text = 'starter' then 'lifetime'::quota_window
        else 'billing_period'::quota_window
      end
    ),
    competitor_gap_limit = coalesce(
      competitor_gap_limit,
      case
        when plan::text = 'starter' then 1
        when plan::text = 'pro' then 3
        when plan::text = 'growth' then null
        else 1
      end
    ),
    competitor_gap_window = coalesce(
      competitor_gap_window,
      case
        when plan::text = 'starter' then 'lifetime'::quota_window
        else 'billing_period'::quota_window
      end
    ),
    token_window = coalesce(
      token_window,
      case
        when plan::text = 'starter' then 'lifetime'::quota_window
        else 'billing_period'::quota_window
      end
    ),
    team_member_limit = coalesce(
      team_member_limit,
      case
        when plan::text = 'growth' then 5
        else 1
      end
    ),
    created_at = coalesce(created_at, now());

-- Seed/refresh canonical plans without destroying existing rows.
insert into public.plan_limits (
  plan,
  billing,
  rewrite_limit,
  rewrite_window,
  competitor_gap_limit,
  competitor_gap_window,
  token_limit,
  token_window,
  team_member_limit,
  created_at
)
values
  ('starter', 'one_time', 2, 'lifetime', 1, 'lifetime', 50000, 'lifetime', 1, now()),
  ('pro', 'monthly', null, 'billing_period', 3, 'billing_period', 300000, 'billing_period', 1, now()),
  ('growth', 'monthly', null, 'billing_period', null, 'billing_period', null, 'billing_period', 5, now())
on conflict (plan) do update
set billing = excluded.billing,
    rewrite_limit = excluded.rewrite_limit,
    rewrite_window = excluded.rewrite_window,
    competitor_gap_limit = excluded.competitor_gap_limit,
    competitor_gap_window = excluded.competitor_gap_window,
    token_limit = excluded.token_limit,
    token_window = excluded.token_window,
    team_member_limit = excluded.team_member_limit;

alter table public.plan_limits
  alter column billing set not null,
  alter column rewrite_window set not null,
  alter column competitor_gap_window set not null,
  alter column token_window set not null,
  alter column team_member_limit set not null,
  alter column team_member_limit set default 1,
  alter column created_at set not null,
  alter column created_at set default now();

-- Ensure subscriptions exists, then evolve in place.
create table if not exists public.subscriptions (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  lemonsqueezy_customer_id text,
  lemonsqueezy_subscription_id text,
  plan text not null default 'starter',
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists lemonsqueezy_customer_id text,
  add column if not exists lemonsqueezy_subscription_id text,
  add column if not exists current_period_end timestamptz,
  add column if not exists created_at timestamptz;

update public.subscriptions
set created_at = coalesce(created_at, now());

alter table public.subscriptions
  alter column created_at set not null,
  alter column created_at set default now();

create unique index if not exists subscriptions_customer_unique_idx
  on public.subscriptions (lemonsqueezy_customer_id)
  where lemonsqueezy_customer_id is not null;

create unique index if not exists subscriptions_subscription_unique_idx
  on public.subscriptions (lemonsqueezy_subscription_id)
  where lemonsqueezy_subscription_id is not null;

create index if not exists subscriptions_plan_status_idx
  on public.subscriptions (plan, status);

-- Re-assert RLS for subscriptions in same migration.
alter table public.subscriptions enable row level security;
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

commit;
