-- 056: Remove legacy fallback finalization columns from reconciliation jobs

begin;

alter table if exists public.usage_finalization_reconciliation
  drop column if exists fallback_tokens,
  drop column if exists fallback_cost_cents;

commit;

