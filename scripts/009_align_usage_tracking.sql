-- 009: Align usage_tracking schema with app usage tracker

begin;

-- Keep the most recent row per user before enforcing single-row primary key
-- Skip if the table already has single rows per user
do $$
begin
  if exists (
    select 1
    from public.usage_tracking
    group by user_id
    having count(*) > 1
    limit 1
  ) then
    with ranked as (
      select
        user_id,
        billing_period_start,
        row_number() over (
          partition by user_id
          order by billing_period_start desc
        ) as row_rank
      from public.usage_tracking
    )
    delete from public.usage_tracking u
    using ranked r
    where u.user_id = r.user_id
      and u.billing_period_start = r.billing_period_start
      and r.row_rank > 1;
  end if;
end $$;

-- Rename legacy token column if present
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'usage_tracking'
      and column_name = 'generation_tokens_used'
  ) then
    alter table public.usage_tracking
      rename column generation_tokens_used to tokens_used;
  end if;
end $$;

-- Ensure required columns exist
alter table public.usage_tracking
  add column if not exists tokens_used int not null default 0,
  add column if not exists ai_cost_cents int not null default 0,
  add column if not exists updated_at timestamptz not null default now();

-- Ensure tokens_used is integer
alter table public.usage_tracking
  alter column tokens_used type int using tokens_used::int;

-- Drop existing primary key (if any) and enforce user_id only
do $$
declare
  constraint_name text;
begin
  select conname
  into constraint_name
  from pg_constraint
  where conrelid = 'public.usage_tracking'::regclass
    and contype = 'p'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.usage_tracking drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.usage_tracking
  add primary key (user_id);

commit;
