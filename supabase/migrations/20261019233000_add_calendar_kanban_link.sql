-- Migration: Add kanban card linkage to calendar_events table
-- Description: Enables bidirectional connection between Kanban tasks and Calendar time-blocking

alter table if exists public.calendar_events
  add column if not exists linked_kanban_card_id text default null,
  add column if not exists linked_kanban_board_id text default null,
  add column if not exists linked_kanban_board_title text default null;

create index if not exists calendar_events_kanban_card_idx
  on public.calendar_events (linked_kanban_card_id)
  where linked_kanban_card_id is not null;
