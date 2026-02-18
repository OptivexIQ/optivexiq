-- 050: Add human-readable request reference IDs for product feedback.

begin;

alter table if exists public.product_feedback
  add column if not exists request_ref text;

create unique index if not exists product_feedback_request_ref_uidx
  on public.product_feedback(request_ref)
  where request_ref is not null;

commit;
