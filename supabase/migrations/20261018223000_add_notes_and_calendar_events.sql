-- Migration: Add keep_notes, keep_labels, and calendar_events tables
-- Description: Cloud synchronization for Notes and Google Calendar time-blocking features

-- 1. Create keep_notes table
create table if not exists public.keep_notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  type text not null default 'checklist' check (type in ('checklist', 'text')),
  content text default '',
  items jsonb default '[]'::jsonb,
  color text not null default 'var(--paper)',
  labels text[] not null default '{}',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Create keep_labels table (user custom labels catalogue)
create table if not exists public.keep_labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint keep_labels_user_name_unique unique (user_id, name)
);

-- 3. Create calendar_events table
create table if not exists public.calendar_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 250),
  date date not null,
  start_time text not null check (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  end_time text not null check (end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  color text not null default '#039be5',
  category text not null default 'event' check (category in ('event', 'task')),
  description text,
  linked_note_id text,
  linked_note_title text,
  linked_item_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for high-performance queries
create index if not exists keep_notes_user_id_idx
  on public.keep_notes (user_id, updated_at desc);

create index if not exists keep_labels_user_id_idx
  on public.keep_labels (user_id, name);

create index if not exists calendar_events_user_id_date_idx
  on public.calendar_events (user_id, date, start_time);

-- Enable Row Level Security (RLS)
alter table public.keep_notes enable row level security;
alter table public.keep_labels enable row level security;
alter table public.calendar_events enable row level security;

-- Policies for keep_notes
drop policy if exists "Users can view their own notes" on public.keep_notes;
create policy "Users can view their own notes"
  on public.keep_notes for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own notes" on public.keep_notes;
create policy "Users can insert their own notes"
  on public.keep_notes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own notes" on public.keep_notes;
create policy "Users can update their own notes"
  on public.keep_notes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own notes" on public.keep_notes;
create policy "Users can delete their own notes"
  on public.keep_notes for delete
  to authenticated
  using (auth.uid() = user_id);

-- Policies for keep_labels
drop policy if exists "Users can view their own labels" on public.keep_labels;
create policy "Users can view their own labels"
  on public.keep_labels for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own labels" on public.keep_labels;
create policy "Users can insert their own labels"
  on public.keep_labels for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own labels" on public.keep_labels;
create policy "Users can delete their own labels"
  on public.keep_labels for delete
  to authenticated
  using (auth.uid() = user_id);

-- Policies for calendar_events
drop policy if exists "Users can view their own calendar events" on public.calendar_events;
create policy "Users can view their own calendar events"
  on public.calendar_events for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own calendar events" on public.calendar_events;
create policy "Users can insert their own calendar events"
  on public.calendar_events for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own calendar events" on public.calendar_events;
create policy "Users can update their own calendar events"
  on public.calendar_events for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own calendar events" on public.calendar_events;
create policy "Users can delete their own calendar events"
  on public.calendar_events for delete
  to authenticated
  using (auth.uid() = user_id);

-- Updated_at triggers
drop trigger if exists keep_notes_set_updated_at on public.keep_notes;
create trigger keep_notes_set_updated_at
  before update on public.keep_notes
  for each row execute procedure public.set_updated_at();

drop trigger if exists calendar_events_set_updated_at on public.calendar_events;
create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row execute procedure public.set_updated_at();
