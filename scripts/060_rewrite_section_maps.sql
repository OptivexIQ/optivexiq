-- 060: Persist rewrite section mapping for reproducible comparison views

create table if not exists public.rewrite_section_maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_ref text not null,
  source text not null check (source in ('deterministic', 'ai')),
  model text null,
  confidence_threshold numeric(4,3) not null default 0.750,
  sections jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, request_ref)
);

create index if not exists rewrite_section_maps_user_updated_idx
  on public.rewrite_section_maps(user_id, updated_at desc);

alter table public.rewrite_section_maps
  add column if not exists taxonomy_version text null,
  add column if not exists prompt_version text null,
  add column if not exists parser_version text null;

alter table public.rewrite_section_maps enable row level security;

drop policy if exists rewrite_section_maps_select_own on public.rewrite_section_maps;
create policy rewrite_section_maps_select_own
  on public.rewrite_section_maps
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists rewrite_section_maps_insert_own on public.rewrite_section_maps;
create policy rewrite_section_maps_insert_own
  on public.rewrite_section_maps
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists rewrite_section_maps_update_own on public.rewrite_section_maps;
create policy rewrite_section_maps_update_own
  on public.rewrite_section_maps
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
