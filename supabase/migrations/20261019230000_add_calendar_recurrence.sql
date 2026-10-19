-- Migration: Add recurrence support to calendar_events table
-- Description: Store event recurrence configuration (daily, weekdays, custom days) with zero database bloat

alter table if exists public.calendar_events
  add column if not exists recurrence jsonb default null;

comment on column public.calendar_events.recurrence is 
  'JSON object specifying frequency (none, daily, weekdays, custom), days_of_week array, and optional until_date';
