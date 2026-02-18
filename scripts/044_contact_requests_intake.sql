-- 044: Add production contact request intake table for public marketing contact form.

begin;

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  company text null,
  message text not null,
  status text not null default 'new',
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

create index if not exists contact_requests_created_at_idx
  on public.contact_requests(created_at desc);

create index if not exists contact_requests_email_idx
  on public.contact_requests(email);

alter table public.contact_requests enable row level security;

drop policy if exists contact_requests_insert_public on public.contact_requests;
create policy contact_requests_insert_public
  on public.contact_requests
  for insert
  to anon, authenticated
  with check (true);

commit;
