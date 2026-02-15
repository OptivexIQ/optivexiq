-- 010: Atomic usage increment helpers

begin;

create or replace function public.increment_usage_tokens(
  p_user_id uuid,
  p_tokens int,
  p_cost_cents int
)
returns setof public.usage_tracking
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.usage_tracking
  set tokens_used = tokens_used + greatest(p_tokens, 0),
      ai_cost_cents = ai_cost_cents + greatest(p_cost_cents, 0),
      updated_at = now()
  where user_id = p_user_id
  returning *;
end;
$$;

grant execute on function public.increment_usage_tokens(uuid, int, int) to authenticated;

create or replace function public.increment_gap_reports(
  p_user_id uuid
)
returns setof public.usage_tracking
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.usage_tracking
  set competitor_gaps_used = competitor_gaps_used + 1,
      updated_at = now()
  where user_id = p_user_id
  returning *;
end;
$$;

grant execute on function public.increment_gap_reports(uuid) to authenticated;

create or replace function public.increment_competitor_gaps(
  p_user_id uuid
)
returns setof public.usage_tracking
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.usage_tracking
  set competitor_gaps_used = competitor_gaps_used + 1,
      updated_at = now()
  where user_id = p_user_id
  returning *;
end;
$$;

grant execute on function public.increment_competitor_gaps(uuid) to authenticated;

create or replace function public.increment_rewrites(
  p_user_id uuid
)
returns setof public.usage_tracking
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.usage_tracking
  set rewrites_used = rewrites_used + 1,
      updated_at = now()
  where user_id = p_user_id
  returning *;
end;
$$;

grant execute on function public.increment_rewrites(uuid) to authenticated;

commit;
