-- 003: Indexes

begin;

create index if not exists conversion_gap_reports_user_id_idx
  on public.conversion_gap_reports (user_id);

create index if not exists conversion_gap_reports_created_at_idx
  on public.conversion_gap_reports (created_at desc);

create index if not exists conversion_gap_reports_status_idx
  on public.conversion_gap_reports (status);

create index if not exists usage_tracking_user_id_idx
  on public.usage_tracking (user_id);

create index if not exists subscriptions_plan_status_idx
  on public.subscriptions (plan, status);

create unique index if not exists subscriptions_lemonsqueezy_customer_id_idx
  on public.subscriptions (lemonsqueezy_customer_id)
  where lemonsqueezy_customer_id is not null;

create unique index if not exists subscriptions_lemonsqueezy_subscription_id_idx
  on public.subscriptions (lemonsqueezy_subscription_id)
  where lemonsqueezy_subscription_id is not null;

commit;
