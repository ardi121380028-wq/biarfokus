-- Migration: Add linked note and checklist item columns to tasks
-- Description: Supports linking Eat Your Frog tasks to Google Keep notes and checklist items

-- 1. Add linked note and item columns to tasks table
alter table public.tasks
  add column if not exists linked_note_id text,
  add column if not exists linked_note_title text,
  add column if not exists linked_item_id text,
  add column if not exists linked_item_text text;

-- 2. Create index for fast lookups by linked note
create index if not exists tasks_user_id_linked_note_idx
  on public.tasks (user_id, linked_note_id)
  where linked_note_id is not null;
