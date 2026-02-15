-- 021: Distributed rate limit storage and atomic consume function

begin;

create table if not exists public.request_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null,
  request_count int not null default 0,
  updated_at timestamptz not null default now()
);

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

grant execute on function public.consume_request_rate_limit(text, int, int) to authenticated;
grant execute on function public.consume_request_rate_limit(text, int, int) to anon;
grant execute on function public.consume_request_rate_limit(text, int, int) to service_role;

create index if not exists request_rate_limits_updated_at_idx
  on public.request_rate_limits (updated_at);

commit;