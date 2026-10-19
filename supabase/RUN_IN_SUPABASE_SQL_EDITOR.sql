-- ==============================================================================
-- BIARFOKUS CONSOLIDATED MIGRATION SCRIPT
-- Jalankan seluruh script ini di Supabase Dashboard -> SQL Editor
-- URL: https://supabase.com/dashboard/project/ulwnircqrqpelhqsdasn/sql/new
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABEL site_visits (Traffic Analytics & Visitor Tracking)
-- ------------------------------------------------------------------------------
create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  path text not null default '/',
  referrer text,
  user_agent text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Indeks performa untuk analitik admin
create index if not exists site_visits_created_at_idx
  on public.site_visits (created_at desc);

create index if not exists site_visits_visitor_date_idx
  on public.site_visits (visitor_id, created_at desc);

create index if not exists site_visits_user_id_idx
  on public.site_visits (user_id) where user_id is not null;

-- Row Level Security (RLS)
alter table public.site_visits enable row level security;

-- Policy 1: Siapa saja (tamu maupun terotentikasi) dapat mencatat kunjungan halaman
drop policy if exists "Anyone can record site visit" on public.site_visits;
create policy "Anyone can record site visit"
  on public.site_visits for insert
  with check (true);

-- Policy 2: Hanya admin yang dapat melihat rekap analitik kunjungan
drop policy if exists "Admins can view site visits" on public.site_visits;
create policy "Admins can view site visits"
  on public.site_visits for select
  using (
    public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 2. KOLOM LINKED ITEM DI calendar_events
-- ------------------------------------------------------------------------------
alter table public.calendar_events
  add column if not exists linked_item_text text;

-- ------------------------------------------------------------------------------
-- 3. KOLOM LINKED NOTE DI tasks (Koneksi Eat Your Frog <-> Catatan & Todo List)
-- ------------------------------------------------------------------------------
alter table public.tasks
  add column if not exists linked_note_id text,
  add column if not exists linked_note_title text,
  add column if not exists linked_item_id text,
  add column if not exists linked_item_text text;

create index if not exists tasks_user_id_linked_note_idx
  on public.tasks (user_id, linked_note_id)
  where linked_note_id is not null;

-- ------------------------------------------------------------------------------
-- 4. TABEL kanban_boards (Cloud Sync Project Canban / Trello Style)
-- ------------------------------------------------------------------------------
create table if not exists public.kanban_boards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My Board',
  description text,
  background text not null default 'wave-blue',
  lists jsonb not null default '[]'::jsonb,
  starred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kanban_boards_user_id_idx
  on public.kanban_boards (user_id, updated_at desc);

alter table public.kanban_boards enable row level security;

-- ------------------------------------------------------------------------------
-- 5. TABEL kanban_board_members & kanban_board_invites (Kolaborasi Tim & Share)
-- ------------------------------------------------------------------------------
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

-- Helper functions
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
    where board_id = check_board_id
      and user_id = coalesce(check_user_id, auth.uid())
  ) or exists (
    select 1
    from public.kanban_boards
    where id = check_board_id
      and user_id = coalesce(check_user_id, auth.uid())
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
      where board_id = check_board_id
        and user_id = coalesce(check_user_id, auth.uid())
      limit 1
    ),
    case
      when exists (
        select 1
        from public.kanban_boards
        where id = check_board_id
          and user_id = coalesce(check_user_id, auth.uid())
      ) then 'owner'
      else null
    end
  );
$$;

-- Auto-register creator as owner
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

-- Join by invite RPC
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

  insert into public.kanban_board_members (board_id, user_id, role)
  values (v_invite.board_id, v_current_user, v_invite.role)
  on conflict (board_id, user_id)
  do update set role = excluded.role;

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

-- RLS Policies for collaborative kanban
alter table public.kanban_board_members enable row level security;
alter table public.kanban_board_invites enable row level security;

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
  with check (auth.uid() = user_id);

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
    or auth.uid() = user_id
  );

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

-- ------------------------------------------------------------------------------
-- 6. TABEL user_subscriptions (Status Langganan Pro Pengguna)
-- ------------------------------------------------------------------------------
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid', 'paused')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_subscriptions_user_id_unique unique (user_id)
);

create index if not exists user_subscriptions_user_id_idx
  on public.user_subscriptions (user_id);

alter table public.user_subscriptions enable row level security;

drop policy if exists "Users can view their own subscription" on public.user_subscriptions;
create policy "Users can view their own subscription"
  on public.user_subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

-- Notifikasi sukses setelah run script
select 'Migrasi database berhasil dijalankan! Tabel site_visits, kanban_boards, kanban_board_members, kanban_board_invites, user_subscriptions, dan kolom relasi tasks siap digunakan.' as status;
