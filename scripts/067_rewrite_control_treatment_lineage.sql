-- 067: Add control/treatment lineage fields and backfill control references.

begin;

alter table public.rewrite_generations
  add column if not exists is_control boolean,
  add column if not exists control_request_ref text;

update public.rewrite_generations
set is_control = false
where is_control is null;

alter table public.rewrite_generations
  alter column is_control set not null,
  alter column is_control set default false;

create index if not exists rewrite_generations_user_experiment_control_idx
  on public.rewrite_generations(user_id, experiment_group_id, is_control);

create index if not exists rewrite_generations_control_request_ref_idx
  on public.rewrite_generations(control_request_ref);

with computed_controls as (
  select
    id,
    coalesce(
      nullif(control_request_ref, ''),
      first_value(request_ref) over (
        partition by user_id, experiment_group_id
        order by is_control desc, version_number asc, created_at asc
      )
    ) as resolved_control_ref
  from public.rewrite_generations
)
update public.rewrite_generations as rg
set control_request_ref = cc.resolved_control_ref
from computed_controls as cc
where rg.id = cc.id
  and (rg.control_request_ref is null or btrim(rg.control_request_ref) = '')
  and cc.resolved_control_ref is not null;

commit;
