-- 071: Add deterministic report metadata columns for reproducibility audits.
-- Additive + idempotent.

begin;

alter table public.conversion_gap_reports
  add column if not exists reproducibility_checksum text,
  add column if not exists section_hashes jsonb;

update public.conversion_gap_reports
set reproducibility_checksum = nullif(report_data->>'reproducibilityChecksum', '')
where reproducibility_checksum is null;

update public.conversion_gap_reports
set section_hashes = case
  when jsonb_typeof(report_data->'sectionHashes') = 'object'
    then report_data->'sectionHashes'
  else '{}'::jsonb
end
where section_hashes is null;

create index if not exists conversion_gap_reports_repro_checksum_idx
  on public.conversion_gap_reports(reproducibility_checksum);

commit;
