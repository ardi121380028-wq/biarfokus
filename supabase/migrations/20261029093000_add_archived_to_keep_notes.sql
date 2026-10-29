-- Migration: Add archived column to keep_notes
-- Description: Persist note archive status in Supabase so archived notes stay archived across page refreshes and devices

alter table public.keep_notes
  add column if not exists archived boolean not null default false;

create index if not exists keep_notes_user_archived_idx
  on public.keep_notes (user_id, archived, updated_at desc);

