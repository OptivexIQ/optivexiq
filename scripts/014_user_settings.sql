-- 014: User settings table and RLS

begin;

create table if not exists public.user_settings (
  user_id uuid primary key
    references public.subscriptions(user_id)
    on delete cascade,

  workspace_name text,
  primary_contact text,
  region text,

  report_retention_days integer not null default 180,
  export_restricted boolean not null default false,

  weekly_exec_summary boolean not null default false,
  completion_alerts boolean not null default false,
  overlap_warnings boolean not null default false,

  security_review_completed boolean not null default false,
  security_review_date timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy user_settings_select_own
  on public.user_settings
  for select
  using (auth.uid() = user_id);

create policy user_settings_insert_own
  on public.user_settings
  for insert
  with check (auth.uid() = user_id);

create policy user_settings_update_own
  on public.user_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
