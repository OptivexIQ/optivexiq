-- 002: Plan limits seed data

begin;

insert into public.plan_limits (plan, gap_reports_limit, token_limit)
values
  ('free', 3, 20000),
  ('starter', 25, 200000),
  ('growth', 100, 1000000),
  ('enterprise', 1000, 10000000)
on conflict (plan) do nothing;

commit;
