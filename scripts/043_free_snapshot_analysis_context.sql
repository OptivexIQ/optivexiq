-- 043: Persist optional free snapshot analysis context

begin;

alter table if exists public.free_conversion_snapshots
  add column if not exists analysis_context text;

commit;
