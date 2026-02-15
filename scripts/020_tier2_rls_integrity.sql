-- 020: Tier 2 RLS integrity hardening

begin;

alter table if exists public.subscriptions enable row level security;
alter table if exists public.conversion_gap_reports enable row level security;
alter table if exists public.usage_tracking enable row level security;
alter table if exists public.user_settings enable row level security;

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists conversion_gap_reports_select_own on public.conversion_gap_reports;
create policy conversion_gap_reports_select_own
  on public.conversion_gap_reports
  for select
  using (auth.uid() = user_id);

drop policy if exists conversion_gap_reports_insert_own on public.conversion_gap_reports;
create policy conversion_gap_reports_insert_own
  on public.conversion_gap_reports
  for insert
  with check (
    auth.uid() = user_id
    and public.can_create_gap_report(user_id)
  );

drop policy if exists usage_tracking_select_own on public.usage_tracking;
create policy usage_tracking_select_own
  on public.usage_tracking
  for select
  using (auth.uid() = user_id);

drop policy if exists user_settings_select_own on public.user_settings;
create policy user_settings_select_own
  on public.user_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists user_settings_insert_own on public.user_settings;
create policy user_settings_insert_own
  on public.user_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists user_settings_update_own on public.user_settings;
create policy user_settings_update_own
  on public.user_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
