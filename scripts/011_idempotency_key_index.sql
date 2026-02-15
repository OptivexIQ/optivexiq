-- 011: Idempotency key index for report creation

begin;

create index if not exists conversion_gap_reports_idempotency_key_idx
  on public.conversion_gap_reports (
    user_id,
    (competitor_data->>'idempotency_key')
  )
  where competitor_data ? 'idempotency_key';

commit;
