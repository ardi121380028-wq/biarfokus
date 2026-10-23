-- Migration: Fix kanban RLS recursion and ensure seamless cross-device synchronization
-- Description: Removes circular dependency between kanban_boards and kanban_board_members, 
-- simplifying policies so that owned boards operate with zero deadlock (matching keep_notes and calendar_events)
-- while maintaining full collaborative sharing support.

-- 1. Redefine helper functions to ONLY inspect kanban_board_members (never circular query back to kanban_boards)
create or replace function public.is_board_member(check_board_id text, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.kanban_board_members
    where board_id::text = check_board_id::text
      and user_id::text = coalesce(check_user_id::text, auth.uid()::text)
  );
$$;

create or replace function public.get_board_role(check_board_id text, check_user_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.kanban_board_members
  where board_id::text = check_board_id::text
    and user_id::text = coalesce(check_user_id::text, auth.uid()::text)
  limit 1;
$$;

-- 2. Non-blocking trigger on kanban_boards creation
create or replace function public.handle_kanban_board_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.kanban_board_members (board_id, user_id, role)
  values (new.id, new.user_id, 'owner')
  on conflict (board_id, user_id) do nothing;
  return new;
exception
  when others then
    -- Never fail board creation even if member insert has conflict
    return new;
end;
$$;

drop trigger if exists kanban_boards_auto_owner_trigger on public.kanban_boards;
create trigger kanban_boards_auto_owner_trigger
after insert on public.kanban_boards
for each row execute procedure public.handle_kanban_board_created();

-- 3. Clean, high-performance RLS Policies on kanban_boards
alter table public.kanban_boards enable row level security;

drop policy if exists "Users can view their own kanban boards" on public.kanban_boards;
drop policy if exists "Users can view accessible kanban boards" on public.kanban_boards;
create policy "Users can view accessible kanban boards"
  on public.kanban_boards for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_board_member(id)
  );

drop policy if exists "Users can insert their own kanban boards" on public.kanban_boards;
create policy "Users can insert their own kanban boards"
  on public.kanban_boards for insert
  to authenticated
  with check (
    auth.uid() = user_id
  );

drop policy if exists "Users can update their own kanban boards" on public.kanban_boards;
drop policy if exists "Users can update accessible kanban boards" on public.kanban_boards;
create policy "Users can update accessible kanban boards"
  on public.kanban_boards for update
  to authenticated
  using (
    auth.uid() = user_id
    or public.get_board_role(id) in ('owner', 'editor')
  )
  with check (
    auth.uid() = user_id
    or public.get_board_role(id) in ('owner', 'editor')
  );

drop policy if exists "Users can delete their own kanban boards" on public.kanban_boards;
drop policy if exists "Owners can delete kanban boards" on public.kanban_boards;
create policy "Owners can delete kanban boards"
  on public.kanban_boards for delete
  to authenticated
  using (
    auth.uid() = user_id
    or public.get_board_role(id) = 'owner'
  );

-- 4. Clean RLS Policies on kanban_board_members
alter table public.kanban_board_members enable row level security;

drop policy if exists "Members can view board members" on public.kanban_board_members;
create policy "Members can view board members"
  on public.kanban_board_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_board_member(board_id)
  );

drop policy if exists "Owners can manage board members" on public.kanban_board_members;
create policy "Owners can manage board members"
  on public.kanban_board_members for all
  to authenticated
  using (
    user_id = auth.uid()
    or public.get_board_role(board_id) = 'owner'
  );

-- 5. Clean RLS Policies on kanban_board_invites
alter table public.kanban_board_invites enable row level security;

drop policy if exists "Members can view invites" on public.kanban_board_invites;
create policy "Members can view invites"
  on public.kanban_board_invites for select
  to authenticated
  using (
    public.is_board_member(board_id)
  );

drop policy if exists "Editors and owners can create invites" on public.kanban_board_invites;
create policy "Editors and owners can create invites"
  on public.kanban_board_invites for insert
  to authenticated
  with check (
    public.get_board_role(board_id) in ('owner', 'editor')
  );

drop policy if exists "Owners can delete invites" on public.kanban_board_invites;
create policy "Owners can delete invites"
  on public.kanban_board_invites for delete
  to authenticated
  using (
    public.get_board_role(board_id) = 'owner'
  );

-- 6. Permissions
grant select, insert, update, delete on public.kanban_boards to authenticated;
grant select, insert, update, delete on public.kanban_board_members to authenticated;
grant select, insert, update, delete on public.kanban_board_invites to authenticated;
