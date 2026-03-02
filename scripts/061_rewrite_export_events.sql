-- 061: Track rewrite export events for guarded export auditability.

begin;

create table if not exists public.rewrite_export_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_ref text not null references public.rewrite_generations(request_ref) on delete cascade,
  format text not null check (format in ('markdown', 'text', 'html', 'pdf')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists rewrite_export_events_user_created_idx
  on public.rewrite_export_events(user_id, created_at desc);

create index if not exists rewrite_export_events_request_ref_idx
  on public.rewrite_export_events(request_ref);

alter table public.rewrite_export_events enable row level security;

drop policy if exists rewrite_export_events_select_own on public.rewrite_export_events;
create policy rewrite_export_events_select_own
  on public.rewrite_export_events
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists rewrite_export_events_insert_own on public.rewrite_export_events;
create policy rewrite_export_events_insert_own
  on public.rewrite_export_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

commit;
