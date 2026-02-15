-- 034: Operational robustness hardening (reconciliation + contract checks)

begin;

create table if not exists public.usage_finalization_reconciliation (
  reservation_key text primary key
    references public.usage_reservations(reservation_key) on delete cascade,
  user_id uuid not null
    references public.user_profiles(id) on delete cascade,
  usage_kind text not null
    check (usage_kind in ('generate')),
  route text not null,
  exact_tokens int not null default 0,
  exact_cost_cents int not null default 0,
  fallback_tokens int not null default 0,
  fallback_cost_cents int not null default 0,
  attempts int not null default 0,
  last_error text,
  next_retry_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists usage_finalization_reconciliation_pending_idx
  on public.usage_finalization_reconciliation (resolved_at, next_retry_at, created_at);

create table if not exists public.operational_alerts (
  id bigserial primary key,
  severity text not null
    check (severity in ('critical', 'high', 'warning')),
  source text not null,
  message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists operational_alerts_created_idx
  on public.operational_alerts (created_at desc);

revoke all on table public.usage_finalization_reconciliation from anon, authenticated;
grant select, insert, update, delete on table public.usage_finalization_reconciliation to service_role;

revoke all on table public.operational_alerts from anon, authenticated;
grant select, insert on table public.operational_alerts to service_role;
grant usage, select on sequence public.operational_alerts_id_seq to service_role;

do $$
declare
  fn record;
begin
  for fn in
    select
      p.oid,
      pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'complete_gap_report_with_reserved_usage'
      and oidvectortypes(p.proargtypes) <>
        'uuid, uuid, text, jsonb, jsonb, jsonb, integer, integer, jsonb'
  loop
    execute format(
      'drop function if exists public.complete_gap_report_with_reserved_usage(%s)',
      fn.identity_args
    );
  end loop;
end $$;

create or replace function public.verify_canonical_gap_completion_rpc_ready()
returns table (
  is_ready boolean,
  matching_count int
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  with candidates as (
    select 1
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'complete_gap_report_with_reserved_usage'
      and oidvectortypes(p.proargtypes) =
        'uuid, uuid, text, jsonb, jsonb, jsonb, integer, integer, jsonb'
  )
  select
    count(*) = 1 as is_ready,
    count(*)::int as matching_count
  from candidates;
$$;

revoke execute on function public.verify_canonical_gap_completion_rpc_ready() from authenticated;
revoke execute on function public.verify_canonical_gap_completion_rpc_ready() from anon;
grant execute on function public.verify_canonical_gap_completion_rpc_ready() to service_role;

commit;

