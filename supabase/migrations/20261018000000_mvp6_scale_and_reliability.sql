-- MVP6: scale and reliability.
-- 1) Idempotent local-task migration (server-side marker + per-user advisory lock).
-- 2) Server-side daily focus aggregation (timezone aware) for stats, streak and export.
-- 3) Additional indexes for hot query paths.

-- ---------------------------------------------------------------------------
-- 1) Idempotent local task migration
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists tasks_migrated_at timestamptz;

-- Users who already have cloud tasks were migrated before this marker existed.
update public.profiles
set tasks_migrated_at = now()
where tasks_migrated_at is null
  and exists (
    select 1
    from public.tasks
    where tasks.user_id = profiles.id
  );

create or replace function public.migrate_local_tasks(p_tasks jsonb)
returns setof public.tasks
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_migrated_at timestamptz;
begin
  if v_user is null then
    raise exception 'Auth session missing';
  end if;
  if p_tasks is null or jsonb_typeof(p_tasks) <> 'array' then
    raise exception 'p_tasks must be a JSON array';
  end if;
  if jsonb_array_length(p_tasks) > 200 then
    raise exception 'Too many tasks to migrate (maximum 200)';
  end if;

  -- Serialises concurrent calls (for example two browser tabs) for the same user.
  perform pg_advisory_xact_lock(hashtextextended('migrate_local_tasks:' || v_user::text, 0));

  select profiles.tasks_migrated_at
  into v_migrated_at
  from public.profiles
  where profiles.id = v_user;

  if v_migrated_at is null
     and not exists (select 1 from public.tasks where tasks.user_id = v_user) then
    insert into public.tasks (user_id, title, completed, pomodoros, created_at)
    select
      v_user,
      left(btrim(e.elem ->> 'title'), 200),
      coalesce((e.elem ->> 'completed')::boolean, false),
      least(greatest(coalesce((e.elem ->> 'pomodoros')::integer, 1), 0), 999),
      now() + (e.ord * interval '1 millisecond')
    from jsonb_array_elements(p_tasks) with ordinality as e(elem, ord)
    where char_length(btrim(coalesce(e.elem ->> 'title', ''))) > 0;
  end if;

  update public.profiles
  set tasks_migrated_at = now()
  where profiles.id = v_user
    and profiles.tasks_migrated_at is null;

  return query
    select *
    from public.tasks
    where tasks.user_id = v_user
    order by tasks.created_at asc;
end;
$$;

revoke all on function public.migrate_local_tasks(jsonb) from public, anon;
grant execute on function public.migrate_local_tasks(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Daily focus aggregation
-- ---------------------------------------------------------------------------
create or replace function public.get_daily_focus(p_days integer, p_timezone text)
returns table (day date, focus_seconds bigint, pomodoro_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (s.completed_at at time zone p_timezone)::date as day,
    sum(s.duration_seconds)::bigint as focus_seconds,
    count(*)::bigint as pomodoro_count
  from public.pomodoro_sessions s
  where s.user_id = auth.uid()
    and s.mode = 'pomodoro'
    and s.completed_at >= (
      (date_trunc('day', now() at time zone p_timezone)
        - make_interval(days => least(greatest(p_days, 1), 366) - 1))
      at time zone p_timezone
    )
  group by 1
  order by 1;
$$;

revoke all on function public.get_daily_focus(integer, text) from public, anon;
grant execute on function public.get_daily_focus(integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Indexes
-- ---------------------------------------------------------------------------
-- Free-plan task limit trigger and migration count active tasks per user.
create index if not exists tasks_user_id_completed_idx
  on public.tasks (user_id, completed);

-- Daily focus aggregation filters by user + mode and a completed_at range.
create index if not exists pomodoro_sessions_user_mode_completed_at_idx
  on public.pomodoro_sessions (user_id, mode, completed_at desc);

-- Admin overview counts sessions across all users for today.
create index if not exists pomodoro_sessions_completed_at_idx
  on public.pomodoro_sessions (completed_at desc);

-- Deleting a task runs "on delete set null" against pomodoro_sessions.task_id.
create index if not exists pomodoro_sessions_task_id_idx
  on public.pomodoro_sessions (task_id)
  where task_id is not null;

-- Foreign key on actor_user_id is cascaded on user deletion.
create index if not exists admin_audit_logs_actor_user_id_idx
  on public.admin_audit_logs (actor_user_id);

create index if not exists subscriptions_plan_status_idx
  on public.subscriptions (plan, status);
