-- 030: Tier 0 distributed rate-limit deployment integrity hardening

begin;

-- Remove any accidental overload drift for consume_request_rate_limit in public.
do $$
declare
  fn record;
begin
  for fn in
    select
      p.oid,
      pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'consume_request_rate_limit'
      and oidvectortypes(p.proargtypes) <> 'text, integer, integer'
  loop
    execute format(
      'drop function if exists public.consume_request_rate_limit(%s)',
      fn.identity_args
    );
  end loop;
end $$;

create or replace function public.consume_request_rate_limit(
  p_rate_key text,
  p_window_seconds int,
  p_max_requests int
)
returns table (
  allowed boolean,
  current_count int,
  window_started_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz := v_now - make_interval(secs => greatest(p_window_seconds, 1));
  v_count int;
  v_started_at timestamptz;
begin
  loop
    update public.request_rate_limits as rl
    set
      request_count = case
        when rl.window_started_at <= v_window_start then 1
        else rl.request_count + 1
      end,
      window_started_at = case
        when rl.window_started_at <= v_window_start then v_now
        else rl.window_started_at
      end,
      updated_at = v_now
    where rl.rate_key = p_rate_key
    returning rl.request_count, rl.window_started_at
    into v_count, v_started_at;

    if found then
      exit;
    end if;

    begin
      insert into public.request_rate_limits as rl (
        rate_key,
        window_started_at,
        request_count,
        updated_at
      ) values (
        p_rate_key,
        v_now,
        1,
        v_now
      )
      returning rl.request_count, rl.window_started_at
      into v_count, v_started_at;
      exit;
    exception
      when unique_violation then
        null;
    end;
  end loop;

  return query
  select
    v_count <= greatest(p_max_requests, 1),
    v_count,
    v_started_at;
end;
$$;

create or replace function public.verify_rate_limit_function_ready()
returns table (
  is_ready boolean,
  matching_count int
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  with candidates as (
    select 1
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'consume_request_rate_limit'
      and oidvectortypes(p.proargtypes) = 'text, integer, integer'
  )
  select
    count(*) = 1 as is_ready,
    count(*)::int as matching_count
  from candidates;
$$;

grant execute on function public.consume_request_rate_limit(text, int, int) to authenticated;
grant execute on function public.consume_request_rate_limit(text, int, int) to anon;
grant execute on function public.consume_request_rate_limit(text, int, int) to service_role;

revoke execute on function public.verify_rate_limit_function_ready() from authenticated;
revoke execute on function public.verify_rate_limit_function_ready() from anon;
grant execute on function public.verify_rate_limit_function_ready() to service_role;

commit;
