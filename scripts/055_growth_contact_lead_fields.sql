-- 055: Add Growth lead routing metadata to contact intake records.

begin;

alter table if exists public.contact_requests
  add column if not exists intent text null,
  add column if not exists lead_tag text null,
  add column if not exists priority boolean not null default false;

commit;
