-- 041: Free conversion snapshot acquisition engine
-- Canonical table + durable job queue for free snapshot generation.

begin;

create table if not exists public.free_conversion_snapshots (
  id uuid primary key default gen_random_uuid(),
  email text,
  website_url text not null,
  competitor_urls jsonb not null default '[]'::jsonb,
  snapshot_data jsonb,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  error_message text,
  unlocked_at timestamptz,
  consent boolean not null default false,
  conversion_from_snapshot boolean not null default false,
  snapshot_user_id uuid references auth.users(id) on delete set null,
  constraint free_conversion_snapshots_status_check check (
    status in ('queued', 'scraping', 'analyzing', 'generating', 'completed', 'failed')
  ),
  constraint free_conversion_snapshots_competitor_urls_array check (
    jsonb_typeof(competitor_urls) = 'array'
  )
);

alter table public.free_conversion_snapshots enable row level security;

create index if not exists free_conversion_snapshots_email_idx
  on public.free_conversion_snapshots (email);

create index if not exists free_conversion_snapshots_created_at_idx
  on public.free_conversion_snapshots (created_at desc);

create index if not exists free_conversion_snapshots_email_website_created_idx
  on public.free_conversion_snapshots (email, website_url, created_at desc);

create table if not exists public.free_snapshot_jobs (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.free_conversion_snapshots(id) on delete cascade,
  status text not null default 'queued',
  attempts int not null default 0,
  last_error text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint free_snapshot_jobs_status_check check (
    status in ('queued', 'processing', 'failed', 'complete')
  )
);

alter table public.free_snapshot_jobs enable row level security;

create unique index if not exists free_snapshot_jobs_snapshot_id_unique_idx
  on public.free_snapshot_jobs (snapshot_id);

create index if not exists free_snapshot_jobs_status_created_idx
  on public.free_snapshot_jobs (status, created_at asc);

create index if not exists free_snapshot_jobs_status_locked_idx
  on public.free_snapshot_jobs (status, locked_at);

commit;
