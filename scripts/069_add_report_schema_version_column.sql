-- 069: Add report schema version column for canonical report read adapters.
-- Additive + idempotent.

begin;

alter table public.conversion_gap_reports
  add column if not exists report_schema_version integer;

update public.conversion_gap_reports
set report_schema_version = case
  when coalesce(report_data->>'reportSchemaVersion', '') ~ '^[0-9]+$'
    then (report_data->>'reportSchemaVersion')::integer
  else 1
end
where report_schema_version is null;

alter table public.conversion_gap_reports
  alter column report_schema_version set default 2,
  alter column report_schema_version set not null;

create index if not exists conversion_gap_reports_schema_version_idx
  on public.conversion_gap_reports(report_schema_version);

commit;
