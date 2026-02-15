-- 038: Tier 2 guard integrity - enforce RLS on report_jobs

begin;

alter table if exists public.report_jobs enable row level security;

drop policy if exists report_jobs_select_own on public.report_jobs;
create policy report_jobs_select_own
  on public.report_jobs
  for select
  using (auth.uid() = user_id);

drop policy if exists report_jobs_insert_own on public.report_jobs;
create policy report_jobs_insert_own
  on public.report_jobs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists report_jobs_update_own on public.report_jobs;
create policy report_jobs_update_own
  on public.report_jobs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists report_jobs_delete_own on public.report_jobs;
create policy report_jobs_delete_own
  on public.report_jobs
  for delete
  using (auth.uid() = user_id);

commit;
