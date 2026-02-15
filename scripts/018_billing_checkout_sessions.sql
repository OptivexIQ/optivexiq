-- 018: Server-owned checkout references for LemonSqueezy attribution

begin;

create table if not exists public.billing_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  checkout_ref text not null unique,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  requested_plan text not null
    check (requested_plan in ('starter', 'pro', 'growth')),
  lemonsqueezy_subscription_id text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists billing_checkout_sessions_subscription_id_idx
  on public.billing_checkout_sessions (lemonsqueezy_subscription_id)
  where lemonsqueezy_subscription_id is not null;

create index if not exists billing_checkout_sessions_user_id_idx
  on public.billing_checkout_sessions (user_id, created_at desc);

commit;
