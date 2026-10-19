-- Migration: Add kanban_boards table
-- Description: Cloud synchronization for Trello-style Project Kanban boards, lists, and cards

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

-- Index for high-performance board lookups
create index if not exists kanban_boards_user_id_idx
  on public.kanban_boards (user_id, updated_at desc);

-- Enable Row Level Security (RLS)
alter table public.kanban_boards enable row level security;

-- Policies for kanban_boards
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
