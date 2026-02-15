-- 035: Database readiness audit (tables, functions, policies, grants, indexes)
-- Run in Supabase SQL editor.

begin;

drop table if exists pg_temp.db_readiness_audit_results;
create temporary table db_readiness_audit_results (
  check_name text not null,
  status text not null check (status in ('pass', 'fail')),
  details text not null
) on commit drop;

do $$
declare
  has_column boolean;
  has_index boolean;
  has_policy boolean;
  has_proc boolean;
  has_constraint boolean;
  rls_enabled boolean;
  has_grant boolean;
  invalid_count bigint;
begin
  -- Required tables
  perform 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'subscriptions' and c.relkind = 'r';
  insert into db_readiness_audit_results values (
    'table.subscriptions',
    case when found then 'pass' else 'fail' end,
    case when found then 'exists' else 'missing table public.subscriptions' end
  );

  perform 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'usage_tracking' and c.relkind = 'r';
  insert into db_readiness_audit_results values (
    'table.usage_tracking',
    case when found then 'pass' else 'fail' end,
    case when found then 'exists' else 'missing table public.usage_tracking' end
  );

  perform 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'conversion_gap_reports' and c.relkind = 'r';
  insert into db_readiness_audit_results values (
    'table.conversion_gap_reports',
    case when found then 'pass' else 'fail' end,
    case when found then 'exists' else 'missing table public.conversion_gap_reports' end
  );

  perform 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'usage_reservations' and c.relkind = 'r';
  insert into db_readiness_audit_results values (
    'table.usage_reservations',
    case when found then 'pass' else 'fail' end,
    case when found then 'exists' else 'missing table public.usage_reservations' end
  );

  perform 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'billing_checkout_sessions' and c.relkind = 'r';
  insert into db_readiness_audit_results values (
    'table.billing_checkout_sessions',
    case when found then 'pass' else 'fail' end,
    case when found then 'exists' else 'missing table public.billing_checkout_sessions' end
  );

  perform 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'usage_finalization_reconciliation' and c.relkind = 'r';
  insert into db_readiness_audit_results values (
    'table.usage_finalization_reconciliation',
    case when found then 'pass' else 'fail' end,
    case when found then 'exists' else 'missing table public.usage_finalization_reconciliation' end
  );

  perform 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'operational_alerts' and c.relkind = 'r';
  insert into db_readiness_audit_results values (
    'table.operational_alerts',
    case when found then 'pass' else 'fail' end,
    case when found then 'exists' else 'missing table public.operational_alerts' end
  );

  -- Required columns
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversion_gap_reports'
      and column_name = 'report_data'
  ) into has_column;
  insert into db_readiness_audit_results values (
    'column.conversion_gap_reports.report_data',
    case when has_column then 'pass' else 'fail' end,
    case when has_column then 'exists' else 'missing column report_data' end
  );

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversion_gap_reports'
      and column_name = 'idempotency_key'
  ) into has_column;
  insert into db_readiness_audit_results values (
    'column.conversion_gap_reports.idempotency_key',
    case when has_column then 'pass' else 'fail' end,
    case when has_column then 'exists' else 'missing column idempotency_key' end
  );

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversion_gap_reports'
      and column_name = 'execution_stage'
  ) into has_column;
  insert into db_readiness_audit_results values (
    'column.conversion_gap_reports.execution_stage',
    case when has_column then 'pass' else 'fail' end,
    case when has_column then 'exists' else 'missing column execution_stage' end
  );

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversion_gap_reports'
      and column_name = 'execution_progress'
  ) into has_column;
  insert into db_readiness_audit_results values (
    'column.conversion_gap_reports.execution_progress',
    case when has_column then 'pass' else 'fail' end,
    case when has_column then 'exists' else 'missing column execution_progress' end
  );

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversion_gap_reports'
      and column_name = 'started_at'
  ) into has_column;
  insert into db_readiness_audit_results values (
    'column.conversion_gap_reports.started_at',
    case when has_column then 'pass' else 'fail' end,
    case when has_column then 'exists' else 'missing column started_at' end
  );

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversion_gap_reports'
      and column_name = 'completed_at'
  ) into has_column;
  insert into db_readiness_audit_results values (
    'column.conversion_gap_reports.completed_at',
    case when has_column then 'pass' else 'fail' end,
    case when has_column then 'exists' else 'missing column completed_at' end
  );

  select exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'conversion_gap_reports'
      and c.conname = 'conversion_gap_reports_execution_progress_range_check'
  ) into has_constraint;
  insert into db_readiness_audit_results values (
    'constraint.conversion_gap_reports_execution_progress_range_check',
    case when has_constraint then 'pass' else 'fail' end,
    case when has_constraint then 'exists' else 'missing execution progress range constraint' end
  );

  select exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'conversion_gap_reports'
      and c.conname = 'conversion_gap_reports_execution_stage_check'
  ) into has_constraint;
  insert into db_readiness_audit_results values (
    'constraint.conversion_gap_reports_execution_stage_check',
    case when has_constraint then 'pass' else 'fail' end,
    case when has_constraint then 'exists' else 'missing execution stage constraint' end
  );

  -- Execution progress integrity
  select count(*)
    into invalid_count
  from public.conversion_gap_reports
  where status = 'running'
    and (
      execution_stage is null
      or execution_progress is null
      or execution_progress < 0
      or execution_progress > 99
    );
  insert into db_readiness_audit_results values (
    'data.conversion_gap_reports.running_execution_integrity',
    case when invalid_count = 0 then 'pass' else 'fail' end,
    case when invalid_count = 0
      then 'running rows have stage/progress'
      else format('invalid running rows=%s', invalid_count)
    end
  );

  select count(*)
    into invalid_count
  from public.conversion_gap_reports
  where status in ('completed', 'failed')
    and (
      execution_stage is distinct from case when status = 'completed' then 'complete' else 'failed' end
      or execution_progress is distinct from 100
    );
  insert into db_readiness_audit_results values (
    'data.conversion_gap_reports.terminal_execution_integrity',
    case when invalid_count = 0 then 'pass' else 'fail' end,
    case when invalid_count = 0
      then 'terminal rows have expected stage/progress'
      else format('invalid terminal rows=%s', invalid_count)
    end
  );

  -- Required indexes
  select exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'conversion_gap_reports_idempotency_key_unique_idx'
  ) into has_index;
  insert into db_readiness_audit_results values (
    'index.conversion_gap_reports_idempotency_key_unique_idx',
    case when has_index then 'pass' else 'fail' end,
    case when has_index then 'exists' else 'missing unique idempotency index' end
  );

  -- RLS + checkout policies
  select c.relrowsecurity
    into rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'billing_checkout_sessions';

  insert into db_readiness_audit_results values (
    'rls.billing_checkout_sessions',
    case when coalesce(rls_enabled, false) then 'pass' else 'fail' end,
    case when coalesce(rls_enabled, false) then 'enabled' else 'RLS disabled' end
  );

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_checkout_sessions'
      and policyname = 'billing_checkout_sessions_select_own'
  ) into has_policy;
  insert into db_readiness_audit_results values (
    'policy.billing_checkout_sessions_select_own',
    case when has_policy then 'pass' else 'fail' end,
    case when has_policy then 'exists' else 'missing SELECT policy' end
  );

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_checkout_sessions'
      and policyname = 'billing_checkout_sessions_insert_own'
  ) into has_policy;
  insert into db_readiness_audit_results values (
    'policy.billing_checkout_sessions_insert_own',
    case when has_policy then 'pass' else 'fail' end,
    case when has_policy then 'exists' else 'missing INSERT policy' end
  );

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_checkout_sessions'
      and policyname = 'billing_checkout_sessions_update_own'
  ) into has_policy;
  insert into db_readiness_audit_results values (
    'policy.billing_checkout_sessions_update_own',
    case when has_policy then 'pass' else 'fail' end,
    case when has_policy then 'exists' else 'missing UPDATE policy' end
  );

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'billing_checkout_sessions'
      and policyname = 'billing_checkout_sessions_delete_own'
  ) into has_policy;
  insert into db_readiness_audit_results values (
    'policy.billing_checkout_sessions_delete_own',
    case when has_policy then 'pass' else 'fail' end,
    case when has_policy then 'exists' else 'missing DELETE policy' end
  );

  -- Required function signatures
  select to_regprocedure('public.consume_request_rate_limit(text,integer,integer)') is not null
    into has_proc;
  insert into db_readiness_audit_results values (
    'function.consume_request_rate_limit(text,integer,integer)',
    case when has_proc then 'pass' else 'fail' end,
    case when has_proc then 'exists' else 'missing function signature' end
  );

  select to_regprocedure('public.verify_rate_limit_function_ready()') is not null
    into has_proc;
  insert into db_readiness_audit_results values (
    'function.verify_rate_limit_function_ready()',
    case when has_proc then 'pass' else 'fail' end,
    case when has_proc then 'exists' else 'missing function signature' end
  );

  select to_regprocedure('public.complete_gap_report_with_reserved_usage(uuid,uuid,text,jsonb,jsonb,jsonb,integer,integer,jsonb)') is not null
    into has_proc;
  insert into db_readiness_audit_results values (
    'function.complete_gap_report_with_reserved_usage(...,jsonb)',
    case when has_proc then 'pass' else 'fail' end,
    case when has_proc then 'exists' else 'missing canonical 9-arg signature' end
  );

  select to_regprocedure('public.verify_canonical_gap_completion_rpc_ready()') is not null
    into has_proc;
  insert into db_readiness_audit_results values (
    'function.verify_canonical_gap_completion_rpc_ready()',
    case when has_proc then 'pass' else 'fail' end,
    case when has_proc then 'exists' else 'missing function signature' end
  );

  select to_regprocedure('public.resolve_entitled_subscription(uuid)') is not null
    into has_proc;
  insert into db_readiness_audit_results values (
    'function.resolve_entitled_subscription(uuid)',
    case when has_proc then 'pass' else 'fail' end,
    case when has_proc then 'exists' else 'missing function signature' end
  );

  -- Grants for canonical completion RPC
  select exists (
    select 1
    from information_schema.role_routine_grants
    where specific_schema = 'public'
      and routine_name = 'complete_gap_report_with_reserved_usage'
      and grantee = 'service_role'
      and privilege_type = 'EXECUTE'
  ) into has_grant;
  insert into db_readiness_audit_results values (
    'grant.complete_gap_report_with_reserved_usage.service_role.execute',
    case when has_grant then 'pass' else 'fail' end,
    case when has_grant then 'granted' else 'missing EXECUTE grant for service_role' end
  );

  select exists (
    select 1
    from information_schema.role_routine_grants
    where specific_schema = 'public'
      and routine_name = 'complete_gap_report_with_reserved_usage'
      and grantee = 'authenticated'
      and privilege_type = 'EXECUTE'
  ) into has_grant;
  insert into db_readiness_audit_results values (
    'grant.complete_gap_report_with_reserved_usage.authenticated.execute',
    case when not has_grant then 'pass' else 'fail' end,
    case when not has_grant then 'revoked' else 'authenticated should not have EXECUTE' end
  );
end
$$;

-- Human-readable results.
select
  check_name,
  status,
  details
from db_readiness_audit_results
order by
  case status when 'fail' then 0 else 1 end,
  check_name;

-- Hard fail if anything is broken.
do $$
declare
  v_fail_count int;
begin
  select count(*) into v_fail_count
  from db_readiness_audit_results
  where status = 'fail';

  if v_fail_count > 0 then
    raise exception 'DB readiness audit failed. failing_checks=%', v_fail_count;
  end if;
end
$$;

commit;
