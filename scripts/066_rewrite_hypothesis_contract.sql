-- 066: Add first-class rewrite hypothesis contract + prompt metadata fields.

begin;

alter table public.rewrite_generations
  add column if not exists hypothesis_type text,
  add column if not exists controlled_variables jsonb,
  add column if not exists treatment_variables jsonb,
  add column if not exists success_criteria text,
  add column if not exists minimum_delta_level text,
  add column if not exists prompt_version integer,
  add column if not exists system_template_version integer,
  add column if not exists model_temperature real,
  add column if not exists delta_metrics jsonb;

update public.rewrite_generations
set
  hypothesis_type = coalesce(nullif(hypothesis_type, ''), 'clarity_simplification'),
  controlled_variables = coalesce(
    controlled_variables,
    case
      when strategy_context ? 'audience' and coalesce(nullif(strategy_context->>'audience', ''), '') <> ''
        then '["audience","tone"]'::jsonb
      else '["tone","structure"]'::jsonb
    end
  ),
  treatment_variables = coalesce(
    treatment_variables,
    case
      when strategy_context ? 'emphasis'
           and lower(coalesce(strategy_context->>'emphasis', '')) like '%objection%'
        then '["objection_handling"]'::jsonb
      when strategy_context ? 'emphasis'
           and lower(coalesce(strategy_context->>'emphasis', '')) like '%differenti%'
        then '["differentiators"]'::jsonb
      else '["headline"]'::jsonb
    end
  ),
  success_criteria = coalesce(
    nullif(success_criteria, ''),
    case
      when rewrite_type = 'pricing'
        then 'Increase pricing clarity and strengthen purchase confidence.'
      else 'Increase above-the-fold clarity and improve conversion intent.'
    end
  ),
  minimum_delta_level = coalesce(nullif(minimum_delta_level, ''), 'light'),
  prompt_version = coalesce(prompt_version, 1),
  system_template_version = coalesce(system_template_version, 1),
  model_temperature = coalesce(model_temperature, 0.35)
where
  hypothesis_type is null
  or controlled_variables is null
  or treatment_variables is null
  or success_criteria is null
  or minimum_delta_level is null
  or prompt_version is null
  or system_template_version is null
  or model_temperature is null;

alter table public.rewrite_generations
  alter column hypothesis_type set not null,
  alter column controlled_variables set not null,
  alter column treatment_variables set not null,
  alter column success_criteria set not null,
  alter column minimum_delta_level set not null,
  alter column prompt_version set not null,
  alter column system_template_version set not null,
  alter column model_temperature set not null;

alter table public.rewrite_generations
  alter column hypothesis_type set default 'clarity_simplification',
  alter column controlled_variables set default '[]'::jsonb,
  alter column treatment_variables set default '[]'::jsonb,
  alter column success_criteria set default '',
  alter column minimum_delta_level set default 'light',
  alter column prompt_version set default 1,
  alter column system_template_version set default 1,
  alter column model_temperature set default 0.35,
  alter column delta_metrics set default null;

alter table public.rewrite_generations
  drop constraint if exists rewrite_generations_hypothesis_type_check,
  drop constraint if exists rewrite_generations_minimum_delta_level_check,
  drop constraint if exists rewrite_generations_prompt_version_check,
  drop constraint if exists rewrite_generations_system_template_version_check,
  drop constraint if exists rewrite_generations_model_temperature_check;

alter table public.rewrite_generations
  add constraint rewrite_generations_hypothesis_type_check check (
    hypothesis_type in (
      'positioning_shift',
      'objection_attack',
      'differentiation_emphasis',
      'risk_reduction',
      'authority_increase',
      'clarity_simplification'
    )
  ),
  add constraint rewrite_generations_minimum_delta_level_check check (
    minimum_delta_level in ('light', 'moderate', 'strong')
  ),
  add constraint rewrite_generations_prompt_version_check check (prompt_version >= 1),
  add constraint rewrite_generations_system_template_version_check check (system_template_version >= 1),
  add constraint rewrite_generations_model_temperature_check check (
    model_temperature >= 0 and model_temperature <= 2
  );

commit;
