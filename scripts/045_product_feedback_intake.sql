-- 045: Add product feedback intake table for feature requests and bug reports.

begin;

create table if not exists public.product_feedback (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check (request_type in ('feature', 'bug')),
  title text not null,
  summary text not null,
  product_area text not null,
  impact text not null check (impact in ('low', 'medium', 'high', 'critical')),
  page_url text null,
  reproduction_steps text null,
  expected_behavior text null,
  actual_behavior text null,
  name text null,
  email text not null,
  company text null,
  status text not null default 'new',
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

create index if not exists product_feedback_created_at_idx
  on public.product_feedback(created_at desc);

create index if not exists product_feedback_request_type_idx
  on public.product_feedback(request_type);

create index if not exists product_feedback_email_idx
  on public.product_feedback(email);

alter table public.product_feedback enable row level security;

drop policy if exists product_feedback_insert_public on public.product_feedback;
create policy product_feedback_insert_public
  on public.product_feedback
  for insert
  to anon, authenticated
  with check (true);

commit;
