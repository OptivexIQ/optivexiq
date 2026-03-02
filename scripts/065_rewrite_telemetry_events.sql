-- 065: Rewrite telemetry events for operational health and analytics.

begin;

create table if not exists public.rewrite_telemetry_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null,
  request_ref text null,
  experiment_group_id uuid null,
  event_type text not null check (
    event_type in (
      'rewrite_started',
      'rewrite_completed',
      'rewrite_failed',
      'rewrite_marked_winner',
      'rewrite_exported'
    )
  ),
  route text null,
  latency_ms integer null check (latency_ms is null or latency_ms >= 0),
  reserved_tokens integer null check (reserved_tokens is null or reserved_tokens >= 0),
  actual_tokens integer null check (actual_tokens is null or actual_tokens >= 0),
  token_drift integer null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists rewrite_telemetry_events_created_idx
  on public.rewrite_telemetry_events(created_at desc);

create index if not exists rewrite_telemetry_events_type_created_idx
  on public.rewrite_telemetry_events(event_type, created_at desc);

create index if not exists rewrite_telemetry_events_request_ref_idx
  on public.rewrite_telemetry_events(request_ref);

create index if not exists rewrite_telemetry_events_experiment_idx
  on public.rewrite_telemetry_events(experiment_group_id);

alter table public.rewrite_telemetry_events enable row level security;

drop policy if exists rewrite_telemetry_events_select_own on public.rewrite_telemetry_events;
create policy rewrite_telemetry_events_select_own
  on public.rewrite_telemetry_events
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists rewrite_telemetry_events_insert_own on public.rewrite_telemetry_events;
create policy rewrite_telemetry_events_insert_own
  on public.rewrite_telemetry_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

commit;
