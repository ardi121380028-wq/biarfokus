-- Migration: Add kanban_board_members and kanban_board_invites tables
-- Description: Multi-user collaboration, board sharing, invite links, and role-based permissions (owner, editor, viewer)

-- 1. Create kanban_board_members table
create table if not exists public.kanban_board_members (
  id uuid primary key default gen_random_uuid(),
  board_id text not null references public.kanban_boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  joined_at timestamptz not null default now(),
  constraint kanban_board_members_unique unique (board_id, user_id)
);

create index if not exists kanban_board_members_board_idx
  on public.kanban_board_members (board_id);

create index if not exists kanban_board_members_user_idx
  on public.kanban_board_members (user_id);

-- 2. Create kanban_board_invites table
create table if not exists public.kanban_board_invites (
  id uuid primary key default gen_random_uuid(),
  board_id text not null references public.kanban_boards(id) on delete cascade,
  invite_code text not null unique,
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  created_by uuid not null references auth.users(id) on delete cascade,
  max_uses int default null,
  uses_count int not null default 0,
  expires_at timestamptz default null,
  created_at timestamptz not null default now()
);

create index if not exists kanban_board_invites_code_idx
  on public.kanban_board_invites (invite_code);

create index if not exists kanban_board_invites_board_idx
  on public.kanban_board_invites (board_id);

-- 3. Security Definer Helper Functions (bypasses RLS to prevent recursion)
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
  ) or exists (
    select 1
    from public.kanban_boards
    where id::text = check_board_id::text
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
  select coalesce(
    (
      select role
      from public.kanban_board_members
      where board_id::text = check_board_id::text
      and user_id::text = coalesce(check_user_id::text, auth.uid()::text)
      limit 1
    ),
    case
      when exists (
        select 1
        from public.kanban_boards
        where id::text = check_board_id::text
      and user_id::text = coalesce(check_user_id::text, auth.uid()::text)
      ) then 'owner'
      else null
    end
  );
$$;

-- 4. Auto-register board creator as owner in kanban_board_members
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
end;
$$;

drop trigger if exists kanban_boards_auto_owner_trigger on public.kanban_boards;
create trigger kanban_boards_auto_owner_trigger
after insert on public.kanban_boards
for each row execute procedure public.handle_kanban_board_created();

-- 5. RPC function: join_kanban_board_by_invite
create or replace function public.join_kanban_board_by_invite(invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_board record;
  v_current_user uuid;
begin
  v_current_user := auth.uid();
  if v_current_user is null then
    raise exception 'Harus login terlebih dahulu untuk bergabung ke papan proyek.';
  end if;

  select * into v_invite
  from public.kanban_board_invites
  where invite_code = invite_token;

  if not found then
    raise exception 'Kode undangan tidak valid atau sudah kadaluarsa.';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'Tautan undangan ini sudah kadaluarsa.';
  end if;

  if v_invite.max_uses is not null and v_invite.uses_count >= v_invite.max_uses then
    raise exception 'Tautan undangan ini sudah mencapai batas maksimum penggunaan.';
  end if;

  select * into v_board
  from public.kanban_boards
  where id = v_invite.board_id;

  if not found then
    raise exception 'Papan kanban tidak ditemukan.';
  end if;

  -- Add or update member
  insert into public.kanban_board_members (board_id, user_id, role)
  values (v_invite.board_id, v_current_user, v_invite.role)
  on conflict (board_id, user_id)
  do update set role = excluded.role;

  -- Increment usage
  update public.kanban_board_invites
  set uses_count = uses_count + 1
  where id = v_invite.id;

  return jsonb_build_object(
    'ok', true,
    'board_id', v_board.id,
    'title', v_board.title,
    'role', v_invite.role
  );
end;
$$;

-- 6. Enable RLS and Configure Collaborative Policies
alter table public.kanban_board_members enable row level security;
alter table public.kanban_board_invites enable row level security;

-- Updated policies for kanban_boards
drop policy if exists "Users can view their own kanban boards" on public.kanban_boards;
drop policy if exists "Users can view accessible kanban boards" on public.kanban_boards;
create policy "Users can view accessible kanban boards"
  on public.kanban_boards for select
  to authenticated
  using (
    auth.uid()::text = user_id::text
    or public.is_board_member(id)
  );

drop policy if exists "Users can update their own kanban boards" on public.kanban_boards;
drop policy if exists "Users can update accessible kanban boards" on public.kanban_boards;
create policy "Users can update accessible kanban boards"
  on public.kanban_boards for update
  to authenticated
  using (
    auth.uid()::text = user_id::text
    or public.get_board_role(id) in ('owner', 'editor')
  )
  with check (
    auth.uid()::text = user_id::text
    or public.get_board_role(id) in ('owner', 'editor')
  );

drop policy if exists "Users can delete their own kanban boards" on public.kanban_boards;
drop policy if exists "Owners can delete kanban boards" on public.kanban_boards;
create policy "Owners can delete kanban boards"
  on public.kanban_boards for delete
  to authenticated
  using (
    auth.uid()::text = user_id::text
    or public.get_board_role(id) = 'owner'
  );

-- Policies for kanban_board_members
drop policy if exists "Members can view board members" on public.kanban_board_members;
create policy "Members can view board members"
  on public.kanban_board_members for select
  to authenticated
  using (
    public.is_board_member(board_id)
  );

drop policy if exists "Owners can manage board members" on public.kanban_board_members;
create policy "Owners can manage board members"
  on public.kanban_board_members for all
  to authenticated
  using (
    public.get_board_role(board_id) = 'owner'
    or auth.uid()::text = user_id::text
  );

-- Policies for kanban_board_invites
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
