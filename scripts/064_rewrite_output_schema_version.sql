-- 064: Track strict rewrite output schema version on persisted generations.

begin;

alter table public.rewrite_generations
  add column if not exists rewrite_output_schema_version integer;

update public.rewrite_generations
set rewrite_output_schema_version = 1
where rewrite_output_schema_version is null;

alter table public.rewrite_generations
  alter column rewrite_output_schema_version set not null,
  alter column rewrite_output_schema_version set default 1;

alter table public.rewrite_generations
  drop constraint if exists rewrite_generations_output_schema_version_check;

alter table public.rewrite_generations
  add constraint rewrite_generations_output_schema_version_check
  check (rewrite_output_schema_version >= 1);

commit;
