-- 057: Queue reliability guardrails (worker heartbeat + poison isolation metadata)

begin;

create table if not exists public.queue_worker_heartbeats (
  worker_name text primary key,
  queue_name text not null check (queue_name in ('report_jobs', 'free_snapshot_jobs')),
  last_seen_at timestamptz not null default now(),
  last_run_started_at timestamptz,
  last_run_completed_at timestamptz,
  last_scanned int not null default 0,
  last_claimed int not null default 0,
  last_completed int not null default 0,
  last_failed int not null default 0,
  last_requeued int not null default 0,
  last_poisoned int not null default 0,
  last_failure_rate numeric(8,4) not null default 0,
  last_oldest_queued_age_seconds int not null default 0,
  last_average_processing_delay_seconds int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists queue_worker_heartbeats_seen_idx
  on public.queue_worker_heartbeats (last_seen_at desc);

alter table if exists public.report_jobs
  add column if not exists poison_reason text,
  add column if not exists poisoned_at timestamptz;

alter table if exists public.free_snapshot_jobs
  add column if not exists poison_reason text,
  add column if not exists poisoned_at timestamptz;

revoke all on table public.queue_worker_heartbeats from anon, authenticated;
grant select, insert, update on table public.queue_worker_heartbeats to service_role;

commit;
