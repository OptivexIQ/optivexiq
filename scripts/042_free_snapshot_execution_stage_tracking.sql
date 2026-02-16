-- 042: Add execution_stage tracking for free snapshot lifecycle visibility

begin;

alter table if exists public.free_conversion_snapshots
  add column if not exists execution_stage text;

alter table if exists public.free_conversion_snapshots
  drop constraint if exists free_conversion_snapshots_execution_stage_check;

alter table public.free_conversion_snapshots
  add constraint free_conversion_snapshots_execution_stage_check check (
    execution_stage is null
    or execution_stage in (
      'fetching_homepage_content',
      'extracting_positioning_signals',
      'analyzing_competitor_structure',
      'generating_executive_diagnosis',
      'scoring_conversion_gaps',
      'finalizing_snapshot'
    )
  );

create index if not exists free_conversion_snapshots_execution_stage_idx
  on public.free_conversion_snapshots (execution_stage);

commit;
