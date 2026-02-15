-- 008: Usage events audit log

begin;

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  action text not null,
  tokens_input int not null default 0,
  tokens_output int not null default 0,
  tokens_total int not null default 0,
  cost_cents int not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_id_idx
  on public.usage_events (user_id);

create index if not exists usage_events_created_at_idx
  on public.usage_events (created_at desc);

commit;
