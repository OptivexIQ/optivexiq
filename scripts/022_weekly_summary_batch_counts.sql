-- 022: Batch weekly summary counts helper

begin;

create or replace function public.get_weekly_completed_report_counts(
  p_user_ids uuid[],
  p_window_start timestamptz,
  p_window_end timestamptz
)
returns table (
  user_id uuid,
  completed_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    reports.user_id,
    count(*)::bigint as completed_count
  from public.conversion_gap_reports reports
  where reports.user_id = any(p_user_ids)
    and reports.status = 'completed'
    and reports.created_at >= p_window_start
    and reports.created_at <= p_window_end
  group by reports.user_id
$$;

grant execute on function public.get_weekly_completed_report_counts(uuid[], timestamptz, timestamptz) to authenticated;
grant execute on function public.get_weekly_completed_report_counts(uuid[], timestamptz, timestamptz) to service_role;

commit;
