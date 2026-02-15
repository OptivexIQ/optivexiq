-- 037: Tier 0 durable report job queue

begin;

create table if not exists public.report_jobs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.conversion_gap_reports(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  status text not null
    check (status in ('queued', 'processing', 'failed', 'complete')),
  attempts int not null default 0 check (attempts >= 0),
  last_error text,
  locked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists report_jobs_report_id_unique_idx
  on public.report_jobs (report_id);

create index if not exists report_jobs_status_created_idx
  on public.report_jobs (status, created_at asc);

create index if not exists report_jobs_status_locked_idx
  on public.report_jobs (status, locked_at);

commit;
