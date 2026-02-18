-- 047: Fix product_feedback RLS insert policy drift.
-- Ensures authenticated submissions from dashboard feedback modal can insert reliably.

begin;

alter table if exists public.product_feedback enable row level security;

-- Normalize grants for API inserts through PostgREST/Supabase client roles.
grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant insert on table public.product_feedback to authenticated;
grant insert on table public.product_feedback to anon;

-- Remove drifted policy variants and recreate canonical insert policy.
drop policy if exists product_feedback_insert_public on public.product_feedback;
drop policy if exists product_feedback_insert_authenticated on public.product_feedback;
drop policy if exists product_feedback_insert_own on public.product_feedback;

create policy product_feedback_insert_authenticated
  on public.product_feedback
  for insert
  to authenticated
  with check (auth.uid() is not null);

-- Keep anon disabled for now; feedback entrypoint is dashboard modal (authenticated).
revoke insert on table public.product_feedback from anon;

commit;
