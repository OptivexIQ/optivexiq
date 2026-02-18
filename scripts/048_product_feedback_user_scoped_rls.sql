-- 048: Make product_feedback inserts explicitly user-scoped for dashboard submissions.

begin;

alter table if exists public.product_feedback
  add column if not exists user_id uuid null;

-- Backfill legacy rows where possible (if any authenticated context was not captured before).
-- No-op for rows without user context.

alter table if exists public.product_feedback
  drop constraint if exists product_feedback_user_fk;

alter table if exists public.product_feedback
  add constraint product_feedback_user_fk
  foreign key (user_id) references auth.users(id) on delete set null;

alter table if exists public.product_feedback enable row level security;

drop policy if exists product_feedback_insert_public on public.product_feedback;
drop policy if exists product_feedback_insert_authenticated on public.product_feedback;
drop policy if exists product_feedback_insert_own on public.product_feedback;

create policy product_feedback_insert_own
  on public.product_feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Dashboard feedback is authenticated-only.
revoke insert on table public.product_feedback from anon;
grant insert on table public.product_feedback to authenticated;

commit;
