-- 063: Persist structured rewrite strategy context and enforce idempotency keys.

begin;

alter table public.rewrite_generations
  add column if not exists strategy_context jsonb,
  add column if not exists idempotency_key text;

update public.rewrite_generations
set strategy_context = jsonb_build_object(
  'target', rewrite_type,
  'goal', coalesce(nullif((regexp_match(coalesce(notes, ''), E'- Goal:\\s*([^\\n]+)'))[1], ''), 'conversion'),
  'icp', coalesce(nullif((regexp_match(coalesce(notes, ''), E'- ICP:\\s*([^\\n]+)'))[1], ''), ''),
  'tone', coalesce(nullif((regexp_match(coalesce(notes, ''), E'- Tone:\\s*([^\\n]+)'))[1], ''), 'neutral'),
  'length', coalesce(nullif((regexp_match(coalesce(notes, ''), E'- Length:\\s*([^\\n]+)'))[1], ''), 'standard'),
  'emphasis', (
    case
      when lower(coalesce(nullif((regexp_match(coalesce(notes, ''), E'- Emphasis:\\s*([^\\n]+)'))[1], ''), 'none')) = 'none'
        then '[]'::jsonb
      else to_jsonb(
        regexp_split_to_array(
          coalesce((regexp_match(coalesce(notes, ''), E'- Emphasis:\\s*([^\\n]+)'))[1], ''),
          E'\\s*,\\s*'
        )
      )
    end
  ),
  'constraints', coalesce(nullif((regexp_match(coalesce(notes, ''), E'- Constraints:\\s*([^\\n]+)'))[1], ''), ''),
  'audience', coalesce(nullif((regexp_match(coalesce(notes, ''), E'- Audience:\\s*([^\\n]+)'))[1], ''), ''),
  'focus', jsonb_build_object(
    'differentiation',
    lower(coalesce((regexp_match(coalesce(notes, ''), E'- Differentiation focus:\\s*([^\\n]+)'))[1], 'on')) <> 'off',
    'objection',
    lower(coalesce((regexp_match(coalesce(notes, ''), E'- Objection focus:\\s*([^\\n]+)'))[1], 'off')) = 'on'
  ),
  'schema_version', 1
)
where strategy_context is null;

update public.rewrite_generations
set idempotency_key = coalesce(nullif(request_id, ''), request_ref)
where idempotency_key is null or btrim(idempotency_key) = '';

alter table public.rewrite_generations
  alter column strategy_context set not null,
  alter column idempotency_key set not null;

create unique index if not exists rewrite_generations_user_idempotency_uidx
  on public.rewrite_generations(user_id, idempotency_key);

commit;
