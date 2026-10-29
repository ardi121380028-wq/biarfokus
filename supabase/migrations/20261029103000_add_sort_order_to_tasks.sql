-- Migration: Add sort_order column to tasks
-- Description: Persist Eat Your Frog task priority ordering across devices

alter table public.tasks
  add column if not exists sort_order integer default null;

create index if not exists tasks_user_sort_order_idx
  on public.tasks (user_id, sort_order asc nulls last, created_at asc);
