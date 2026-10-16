create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  completed boolean not null default false,
  pomodoros integer not null default 1 check (pomodoros between 0 and 999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  mode text not null check (mode in ('pomodoro', 'short', 'long')),
  duration_seconds integer not null check (duration_seconds between 1 and 86400),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_id_created_at_idx
  on public.tasks (user_id, created_at desc);

create index if not exists pomodoro_sessions_user_id_completed_at_idx
  on public.pomodoro_sessions (user_id, completed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.pomodoro_sessions enable row level security;

drop policy if exists "Users can view their profile" on public.profiles;
create policy "Users can view their profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can view their tasks" on public.tasks;
create policy "Users can view their tasks"
on public.tasks for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their tasks" on public.tasks;
create policy "Users can create their tasks"
on public.tasks for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their tasks" on public.tasks;
create policy "Users can update their tasks"
on public.tasks for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their tasks" on public.tasks;
create policy "Users can delete their tasks"
on public.tasks for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their sessions" on public.pomodoro_sessions;
create policy "Users can view their sessions"
on public.pomodoro_sessions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their sessions" on public.pomodoro_sessions;
create policy "Users can create their sessions"
on public.pomodoro_sessions for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    task_id is null
    or exists (
      select 1
      from public.tasks
      where tasks.id = pomodoro_sessions.task_id
        and tasks.user_id = auth.uid()
    )
  )
);
