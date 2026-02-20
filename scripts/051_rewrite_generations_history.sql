-- 051: Persist rewrite studio generations with support-friendly request refs.

begin;

create table if not exists public.rewrite_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null,
  request_ref text not null,
  rewrite_type text not null check (rewrite_type in ('homepage', 'pricing')),
  website_url text null,
  notes text null,
  source_content text null,
  output_markdown text not null,
  model text not null,
  tokens_input integer not null default 0 check (tokens_input >= 0),
  tokens_output integer not null default 0 check (tokens_output >= 0),
  cost_cents integer not null default 0 check (cost_cents >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists rewrite_generations_request_ref_uidx
  on public.rewrite_generations(request_ref);

create index if not exists rewrite_generations_user_created_idx
  on public.rewrite_generations(user_id, created_at desc);

alter table public.rewrite_generations enable row level security;

drop policy if exists rewrite_generations_select_own on public.rewrite_generations;
create policy rewrite_generations_select_own
  on public.rewrite_generations
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists rewrite_generations_insert_own on public.rewrite_generations;
create policy rewrite_generations_insert_own
  on public.rewrite_generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

commit;

