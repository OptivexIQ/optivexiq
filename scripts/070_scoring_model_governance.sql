-- 070: Add scoring governance registry for calibration metadata visibility.
-- Additive + idempotent.

begin;

create table if not exists public.scoring_model_versions (
  version text primary key,
  last_calibrated_at timestamptz not null,
  training_sample_size integer not null check (training_sample_size >= 0),
  drift_threshold numeric not null check (drift_threshold >= 0),
  taxonomy_version text not null,
  scoring_weights_version text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.scoring_model_versions (
  version,
  last_calibrated_at,
  training_sample_size,
  drift_threshold,
  taxonomy_version,
  scoring_weights_version,
  metadata
)
values (
  'v2.1',
  now(),
  0,
  0.1,
  'v1.0',
  '2026-03-03.v1',
  jsonb_build_object('seeded_by_migration', true)
)
on conflict (version) do nothing;

create index if not exists scoring_model_versions_updated_idx
  on public.scoring_model_versions(updated_at desc);

commit;
