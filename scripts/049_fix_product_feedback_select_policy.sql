-- 049: Add explicit SELECT policy for product_feedback and keep strict user-scoped access.

begin;

alter table if exists public.product_feedback enable row level security;

drop policy if exists product_feedback_select_own on public.product_feedback;
create policy product_feedback_select_own
  on public.product_feedback
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Keep strict insert policy user-scoped.
drop policy if exists product_feedback_insert_own on public.product_feedback;
create policy product_feedback_insert_own
  on public.product_feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);

commit;
