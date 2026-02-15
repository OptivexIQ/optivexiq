-- 001: Extensions and core tables

begin;

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.saas_profiles (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  icp_role text,
  acv_range text,
  sales_motion text,
  primary_conversion_goal text,
  pricing_model text,
  created_at timestamptz not null default now()
);

create table if not exists public.conversion_gap_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  homepage_url text,
  pricing_url text,
  competitor_data jsonb not null default '{}'::jsonb,
  gap_analysis jsonb not null default '{}'::jsonb,
  rewrites jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  created_at timestamptz not null default now(),
  constraint conversion_gap_reports_status_check
    check (status in ('queued', 'running', 'completed', 'failed'))
);

create table if not exists public.usage_tracking (
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  generation_tokens_used bigint not null default 0,
  tokens_used int not null default 0,
  competitor_gaps_used int not null default 0,
  rewrites_used int not null default 0,
  ai_cost_cents int not null default 0,
  updated_at timestamptz not null default now(),
  billing_period_start timestamptz not null,
  billing_period_end timestamptz not null,
  created_at timestamptz not null default now(),
  constraint usage_tracking_period_check
    check (billing_period_end > billing_period_start),
  primary key (user_id, billing_period_start)
);

create table if not exists public.subscriptions (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  lemonsqueezy_customer_id text,
  lemonsqueezy_subscription_id text,
  plan text not null default 'free',
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_limits (
  plan text primary key,
  gap_reports_limit int not null,
  token_limit bigint not null
);

commit;
