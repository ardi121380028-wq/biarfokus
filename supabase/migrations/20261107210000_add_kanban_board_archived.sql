-- Migration: Add archived and archived_at columns to kanban_boards table
-- Safe for re-execution (idempotent)

alter table public.kanban_boards
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz;

create index if not exists kanban_boards_archived_idx
  on public.kanban_boards (user_id, archived);

