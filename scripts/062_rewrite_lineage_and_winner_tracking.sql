-- 062: Add rewrite experiment lineage and winner tracking.

begin;

alter table public.rewrite_generations
  add column if not exists experiment_group_id uuid,
  add column if not exists parent_request_ref text null,
  add column if not exists version_number integer not null default 1,
  add column if not exists is_winner boolean not null default false,
  add column if not exists winner_label text null,
  add column if not exists winner_marked_at timestamptz null;

update public.rewrite_generations
set experiment_group_id = gen_random_uuid()
where experiment_group_id is null;

alter table public.rewrite_generations
  alter column experiment_group_id set not null;

alter table public.rewrite_generations
  drop constraint if exists rewrite_generations_version_number_check;

alter table public.rewrite_generations
  add constraint rewrite_generations_version_number_check
  check (version_number >= 1);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rewrite_generations_parent_request_ref_fkey'
  ) then
    alter table public.rewrite_generations
      add constraint rewrite_generations_parent_request_ref_fkey
      foreign key (parent_request_ref)
      references public.rewrite_generations(request_ref)
      on delete set null;
  end if;
end
$$;

create index if not exists rewrite_generations_experiment_idx
  on public.rewrite_generations(user_id, experiment_group_id, version_number);

create index if not exists rewrite_generations_parent_ref_idx
  on public.rewrite_generations(parent_request_ref);

create unique index if not exists rewrite_generations_one_winner_per_experiment_uidx
  on public.rewrite_generations(user_id, experiment_group_id)
  where is_winner = true;

commit;
