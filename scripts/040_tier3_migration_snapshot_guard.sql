-- 040: Tier 3 migration snapshot guard - runtime verification of canonical DB contract

begin;

create or replace function public.verify_canonical_migration_snapshot_ready()
returns table (
  is_ready boolean,
  mismatch_count integer,
  mismatch_keys text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mismatches text[] := array[]::text[];
  v_count integer;
begin
  if to_regprocedure('public.resolve_entitled_subscription(uuid)') is null then
    v_mismatches := array_append(v_mismatches, 'fn.resolve_entitled_subscription(uuid)');
  end if;

  if to_regprocedure('public.reserve_generate_usage(uuid,text,integer,integer)') is null then
    v_mismatches := array_append(v_mismatches, 'fn.reserve_generate_usage(uuid,text,integer,integer)');
  end if;

  if to_regprocedure('public.finalize_generate_usage(uuid,text,integer,integer)') is null then
    v_mismatches := array_append(v_mismatches, 'fn.finalize_generate_usage(uuid,text,integer,integer)');
  end if;

  if to_regprocedure('public.rollback_generate_usage(uuid,text)') is null then
    v_mismatches := array_append(v_mismatches, 'fn.rollback_generate_usage(uuid,text)');
  end if;

  if to_regprocedure('public.reserve_gap_report_quota(uuid,uuid,text)') is null then
    v_mismatches := array_append(v_mismatches, 'fn.reserve_gap_report_quota(uuid,uuid,text)');
  end if;

  if to_regprocedure('public.rollback_gap_report_quota_reservation(uuid,text)') is null then
    v_mismatches := array_append(v_mismatches, 'fn.rollback_gap_report_quota_reservation(uuid,text)');
  end if;

  if to_regprocedure('public.complete_gap_report_with_reserved_usage(uuid,uuid,text,jsonb,jsonb,jsonb,integer,integer,jsonb)') is null then
    v_mismatches := array_append(v_mismatches, 'fn.complete_gap_report_with_reserved_usage(uuid,uuid,text,jsonb,jsonb,jsonb,integer,integer,jsonb)');
  end if;

  if to_regprocedure('public.complete_snapshot_report_with_usage(uuid,uuid,jsonb,integer,integer)') is null then
    v_mismatches := array_append(v_mismatches, 'fn.complete_snapshot_report_with_usage(uuid,uuid,jsonb,integer,integer)');
  end if;

  if to_regprocedure('public.consume_request_rate_limit(text,integer,integer)') is null then
    v_mismatches := array_append(v_mismatches, 'fn.consume_request_rate_limit(text,integer,integer)');
  end if;

  if to_regprocedure('public.verify_rate_limit_function_ready()') is null then
    v_mismatches := array_append(v_mismatches, 'fn.verify_rate_limit_function_ready()');
  end if;

  if to_regprocedure('public.verify_canonical_gap_completion_rpc_ready()') is null then
    v_mismatches := array_append(v_mismatches, 'fn.verify_canonical_gap_completion_rpc_ready()');
  end if;

  if to_regprocedure('public.complete_gap_report_with_reserved_usage(uuid,uuid,text,jsonb,jsonb,jsonb,integer,integer)') is not null then
    v_mismatches := array_append(v_mismatches, 'fn.legacy_complete_gap_report_with_reserved_usage_8_arg_present');
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversion_gap_reports'
      and column_name = 'report_data'
  ) then
    v_mismatches := array_append(v_mismatches, 'table.conversion_gap_reports.report_data');
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversion_gap_reports'
      and column_name = 'execution_stage'
  ) then
    v_mismatches := array_append(v_mismatches, 'table.conversion_gap_reports.execution_stage');
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversion_gap_reports'
      and column_name = 'execution_progress'
  ) then
    v_mismatches := array_append(v_mismatches, 'table.conversion_gap_reports.execution_progress');
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversion_gap_reports'
      and column_name = 'started_at'
  ) then
    v_mismatches := array_append(v_mismatches, 'table.conversion_gap_reports.started_at');
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversion_gap_reports'
      and column_name = 'completed_at'
  ) then
    v_mismatches := array_append(v_mismatches, 'table.conversion_gap_reports.completed_at');
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'conversion_gap_reports_idempotency_key_unique_idx'
  ) then
    v_mismatches := array_append(v_mismatches, 'index.conversion_gap_reports_idempotency_key_unique_idx');
  end if;

  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'usage_reservations'
      and c.relkind = 'r'
  ) then
    v_mismatches := array_append(v_mismatches, 'table.usage_reservations');
  end if;

  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'report_jobs'
      and c.relkind = 'r'
  ) then
    v_mismatches := array_append(v_mismatches, 'table.report_jobs');
  end if;

  v_count := coalesce(array_length(v_mismatches, 1), 0);

  return query
  select
    v_count = 0,
    v_count,
    v_mismatches;
end;
$$;

revoke execute on function public.verify_canonical_migration_snapshot_ready() from public;
grant execute on function public.verify_canonical_migration_snapshot_ready() to service_role;

commit;
