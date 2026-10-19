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

drop policy if exists "Users can view their own kanban boards" on public.kanban_boards;
create policy "Users can view their own kanban boards"
  on public.kanban_boards for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own kanban boards" on public.kanban_boards;
create policy "Users can insert their own kanban boards"
  on public.kanban_boards for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own kanban boards" on public.kanban_boards;
create policy "Users can update their own kanban boards"
  on public.kanban_boards for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own kanban boards" on public.kanban_boards;
create policy "Users can delete their own kanban boards"
  on public.kanban_boards for delete
  to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. TABEL user_subscriptions (Status Langganan Pro Pengguna)
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
select 'Migrasi database berhasil dijalankan! Tabel site_visits, kanban_boards, user_subscriptions, dan kolom relasi tasks siap digunakan.' as status;
