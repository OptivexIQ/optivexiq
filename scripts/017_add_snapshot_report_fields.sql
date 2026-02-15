-- 017: Add snapshot report fields

begin;

alter table public.conversion_gap_reports
  add column if not exists report_type text not null default 'full',
  add column if not exists is_partial boolean not null default false,
  add column if not exists snapshot_result jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversion_gap_reports_report_type_check'
  ) then
    alter table public.conversion_gap_reports
      add constraint conversion_gap_reports_report_type_check
      check (report_type in ('full', 'snapshot'));
  end if;
end $$;

commit;
