-- 036: Durable execution stage/progress tracking for report generation

begin;

alter table if exists public.conversion_gap_reports
  add column if not exists execution_stage text;

alter table if exists public.conversion_gap_reports
  add column if not exists execution_progress integer;

alter table if exists public.conversion_gap_reports
  add column if not exists started_at timestamptz;

alter table if exists public.conversion_gap_reports
  add column if not exists completed_at timestamptz;

alter table public.conversion_gap_reports
  drop constraint if exists conversion_gap_reports_execution_progress_range_check;

alter table public.conversion_gap_reports
  add constraint conversion_gap_reports_execution_progress_range_check
  check (execution_progress is null or (execution_progress >= 0 and execution_progress <= 100));

alter table public.conversion_gap_reports
  drop constraint if exists conversion_gap_reports_execution_stage_check;

alter table public.conversion_gap_reports
  add constraint conversion_gap_reports_execution_stage_check
  check (
    execution_stage is null
    or execution_stage in (
      'queued',
      'scraping_homepage',
      'scraping_pricing',
      'scraping_competitors',
      'gap_analysis',
      'competitor_synthesis',
      'scoring',
      'rewrite_generation',
      'finalizing',
      'complete',
      'failed'
    )
  );

update public.conversion_gap_reports
set execution_stage = 'queued',
    execution_progress = 0
where status = 'queued'
  and (execution_stage is null or execution_progress is null);

update public.conversion_gap_reports
set execution_stage = coalesce(execution_stage, 'scraping_homepage'),
    execution_progress = coalesce(execution_progress, 5),
    started_at = coalesce(started_at, created_at, now())
where status = 'running';

update public.conversion_gap_reports
set execution_stage = 'complete',
    execution_progress = 100,
    started_at = coalesce(started_at, created_at, now()),
    completed_at = coalesce(completed_at, now())
where status = 'completed';

update public.conversion_gap_reports
set execution_stage = 'failed',
    execution_progress = 100,
    started_at = coalesce(started_at, created_at, now()),
    completed_at = coalesce(completed_at, now())
where status = 'failed';

commit;

