create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_roles_set_updated_at on public.user_roles;
create trigger user_roles_set_updated_at
before update on public.user_roles
for each row execute procedure public.set_updated_at();

insert into public.user_roles (user_id, role)
select id, 'user'
from auth.users
on conflict (user_id) do nothing;

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

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = coalesce(check_user_id, auth.uid())
      and role = 'admin'
  );
$$;

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (char_length(trim(action)) between 1 and 120),
  target_type text not null check (char_length(trim(target_type)) between 1 and 80),
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

alter table public.user_roles enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "Users can view their own role" on public.user_roles;
create policy "Users can view their own role"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can manage user roles" on public.user_roles;
create policy "Admins can manage user roles"
on public.user_roles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can view audit logs" on public.admin_audit_logs;
create policy "Admins can view audit logs"
on public.admin_audit_logs for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can create audit logs" on public.admin_audit_logs;
create policy "Admins can create audit logs"
on public.admin_audit_logs for insert
to authenticated
with check (public.is_admin() and auth.uid() = actor_user_id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all tasks" on public.tasks;
create policy "Admins can view all tasks"
on public.tasks for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all sessions" on public.pomodoro_sessions;
create policy "Admins can view all sessions"
on public.pomodoro_sessions for select
to authenticated
using (public.is_admin());
