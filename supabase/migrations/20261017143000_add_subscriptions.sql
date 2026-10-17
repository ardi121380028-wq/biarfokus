create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'inactive' check (status in ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute procedure public.set_updated_at();

insert into public.subscriptions (user_id, plan, status)
select id, 'free', 'inactive'
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

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'inactive')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.is_pro_user(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions
    where user_id = coalesce(check_user_id, auth.uid())
      and plan = 'pro'
      and status in ('active', 'trialing')
      and (current_period_end is null or current_period_end > now())
  ) or public.is_admin(check_user_id);
$$;

create or replace function public.enforce_task_plan_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_task_count integer;
begin
  if public.is_pro_user(new.user_id) then
    return new;
  end if;

  select count(*)
  into active_task_count
  from public.tasks
  where user_id = new.user_id
    and completed = false;

  if active_task_count >= 10 then
    raise exception 'Batas paket Free tercapai (maksimal 10 task aktif). Upgrade ke Pro untuk task tanpa batas.';
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_enforce_plan_limit on public.tasks;
create trigger tasks_enforce_plan_limit
before insert on public.tasks
for each row execute procedure public.enforce_task_plan_limit();

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view their own subscription" on public.subscriptions;
create policy "Users can view their own subscription"
on public.subscriptions for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can manage subscriptions" on public.subscriptions;
create policy "Admins can manage subscriptions"
on public.subscriptions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
