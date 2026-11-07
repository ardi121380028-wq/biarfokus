-- Migration: Add Leaderboard RPC and profile privacy setting
-- Description: Aggregates focus sessions for Daily, Weekly, Monthly and All-Time leaderboards

-- 1. Add show_on_leaderboard column to profiles
alter table public.profiles
  add column if not exists show_on_leaderboard boolean not null default true;

-- 2. Allow authenticated users to view public profile info (display name & avatar)
drop policy if exists "Public profiles are viewable by authenticated users" on public.profiles;
create policy "Public profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (coalesce(show_on_leaderboard, true) = true);

-- 3. Indexes for fast leaderboard aggregation
create index if not exists pomodoro_sessions_leaderboard_idx
  on public.pomodoro_sessions (mode, completed_at desc, duration_seconds);

-- 4. Leaderboard retrieval RPC function (Security Definer to aggregate across all users)
create or replace function public.get_leaderboard(
  p_period text default 'weekly',
  p_limit integer default 50
)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  total_minutes bigint,
  pomodoro_count bigint,
  is_pro boolean,
  is_current_user boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_user uuid := auth.uid();
  v_cutoff timestamptz;
begin
  -- Determine time period cutoff
  if p_period = 'daily' then
    v_cutoff := date_trunc('day', now());
  elsif p_period = 'weekly' then
    v_cutoff := date_trunc('week', now());
  elsif p_period = 'monthly' then
    v_cutoff := date_trunc('month', now());
  else
    v_cutoff := '1970-01-01 00:00:00+00'::timestamptz;
  end if;

  return query
  with user_aggregates as (
    select
      s.user_id as agg_user_id,
      sum(s.duration_seconds) / 60 as agg_minutes,
      count(*)::bigint as agg_count
    from public.pomodoro_sessions s
    where s.mode = 'pomodoro'
      and (p_period = 'all_time' or s.completed_at >= v_cutoff)
    group by s.user_id
  ),
  ranked_users as (
    select
      row_number() over (
        order by coalesce(a.agg_minutes, 0) desc, coalesce(a.agg_count, 0) desc, p.created_at asc
      ) as user_rank,
      p.id as agg_user_id,
      coalesce(
        nullif(trim(p.display_name), ''),
        nullif(trim(p.username), ''),
        'Pejuang Fokus #' || right(p.id::text, 4)
      ) as user_name,
      p.avatar_url as user_avatar,
      coalesce(a.agg_minutes, 0)::bigint as agg_minutes,
      coalesce(a.agg_count, 0)::bigint as agg_count,
      coalesce(sub.plan = 'pro' and sub.status in ('active', 'trialing') and (sub.current_period_end is null or sub.current_period_end > now()), false) as user_is_pro,
      (p.id = v_current_user) as user_is_current
    from public.profiles p
    left join user_aggregates a on a.agg_user_id = p.id
    left join public.subscriptions sub on sub.user_id = p.id
    where coalesce(p.show_on_leaderboard, true) = true
  )
  select
    r.user_rank,
    r.agg_user_id,
    r.user_name,
    r.user_avatar,
    r.agg_minutes,
    r.agg_count,
    r.user_is_pro,
    r.user_is_current
  from ranked_users r
  order by r.user_rank asc
  limit least(greatest(p_limit, 1), 100);
end;
$$;

-- 5. Single user rank retrieval helper (for sticky rank bar when outside top N)
create or replace function public.get_my_leaderboard_rank(
  p_period text default 'weekly'
)
returns table (
  rank bigint,
  total_minutes bigint,
  pomodoro_count bigint,
  total_participants bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_user uuid := auth.uid();
  v_cutoff timestamptz;
begin
  if v_current_user is null then
    return;
  end if;

  if p_period = 'daily' then
    v_cutoff := date_trunc('day', now());
  elsif p_period = 'weekly' then
    v_cutoff := date_trunc('week', now());
  elsif p_period = 'monthly' then
    v_cutoff := date_trunc('month', now());
  else
    v_cutoff := '1970-01-01 00:00:00+00'::timestamptz;
  end if;

  return query
  with user_aggregates as (
    select
      s.user_id as agg_user_id,
      sum(s.duration_seconds) / 60 as agg_minutes,
      count(*)::bigint as agg_count
    from public.pomodoro_sessions s
    where s.mode = 'pomodoro'
      and (p_period = 'all_time' or s.completed_at >= v_cutoff)
    group by s.user_id
  ),
  ranked_users as (
    select
      row_number() over (
        order by coalesce(a.agg_minutes, 0) desc, coalesce(a.agg_count, 0) desc, p.created_at asc
      ) as user_rank,
      p.id as agg_user_id,
      coalesce(a.agg_minutes, 0)::bigint as agg_minutes,
      coalesce(a.agg_count, 0)::bigint as agg_count
    from public.profiles p
    left join user_aggregates a on a.agg_user_id = p.id
    where coalesce(p.show_on_leaderboard, true) = true
  ),
  total_count as (
    select count(*)::bigint as total from ranked_users
  )
  select
    r.user_rank,
    r.agg_minutes,
    r.agg_count,
    t.total
  from ranked_users r, total_count t
  where r.agg_user_id = v_current_user;
end;
$$;

-- Grant access to authenticated and anonymous users
revoke all on function public.get_leaderboard(text, integer) from public;
grant execute on function public.get_leaderboard(text, integer) to anon, authenticated;

revoke all on function public.get_my_leaderboard_rank(text) from public;
grant execute on function public.get_my_leaderboard_rank(text) to authenticated;
