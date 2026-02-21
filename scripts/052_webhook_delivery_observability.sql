create table if not exists public.webhook_delivery_events (
  id bigserial primary key,
  provider text not null check (provider in ('lemonsqueezy')),
  delivery_fingerprint text not null,
  event_name text,
  subscription_id text,
  status_code integer not null,
  success boolean not null,
  replay_signal boolean not null default false,
  duration_ms integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists webhook_delivery_events_created_idx
  on public.webhook_delivery_events (created_at desc);

create index if not exists webhook_delivery_events_fingerprint_idx
  on public.webhook_delivery_events (provider, delivery_fingerprint, created_at desc);

create index if not exists webhook_delivery_events_failure_idx
  on public.webhook_delivery_events (provider, success, created_at desc);

revoke all on table public.webhook_delivery_events from anon, authenticated;
grant select, insert on table public.webhook_delivery_events to service_role;
grant usage, select on sequence public.webhook_delivery_events_id_seq to service_role;
