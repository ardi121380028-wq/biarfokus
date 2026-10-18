-- Migration: Add linked_item_text to calendar_events and site_visits table
-- Description: Supports specific checklist item time-blocking and admin website traffic analytics

-- 1. Add linked_item_text to calendar_events if not already present
alter table public.calendar_events
  add column if not exists linked_item_text text;

-- 2. Create site_visits table for website traffic and visitor tracking
create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  path text not null default '/',
  referrer text,
  user_agent text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- High-performance indexes for admin analytics
create index if not exists site_visits_created_at_idx
  on public.site_visits (created_at desc);

create index if not exists site_visits_visitor_date_idx
  on public.site_visits (visitor_id, created_at desc);

create index if not exists site_visits_user_id_idx
  on public.site_visits (user_id) where user_id is not null;

-- Enable Row Level Security (RLS)
alter table public.site_visits enable row level security;

-- Policy 1: Anyone (guest or authenticated) can log their site visit
drop policy if exists "Anyone can record site visit" on public.site_visits;
create policy "Anyone can record site visit"
  on public.site_visits for insert
  with check (true);

-- Policy 2: Only administrators can query visitor analytics
drop policy if exists "Admins can view site visits" on public.site_visits;
create policy "Admins can view site visits"
  on public.site_visits for select
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );
