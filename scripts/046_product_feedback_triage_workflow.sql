-- 046: Add triage workflow fields and stricter status controls for product feedback.

begin;

alter table if exists public.product_feedback
  add column if not exists triage_owner text null,
  add column if not exists triaged_at timestamptz null,
  add column if not exists resolved_at timestamptz null,
  add column if not exists resolution_note text null;

alter table if exists public.product_feedback
  drop constraint if exists product_feedback_status_check;

alter table if exists public.product_feedback
  add constraint product_feedback_status_check
  check (status in ('new', 'triaged', 'planned', 'in_progress', 'fixed', 'closed', 'rejected'));

create index if not exists product_feedback_status_created_idx
  on public.product_feedback(status, created_at desc);

commit;
