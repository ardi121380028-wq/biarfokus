"use client";

import { useCallback } from "react";
import type { CalendarEvent } from "@/types/domain";
import { useLocalStoreValue } from "@/lib/storage/local-store";
import {
  createEventId,
  EMPTY_EVENTS,
  getCalendarStorageKey,
  parseStoredEvents,
  type EventDraft,
} from "@/features/calendar/calendar-service";

export function useCalendarEvents(userId?: string | null) {
  const [events, update] = useLocalStoreValue(getCalendarStorageKey(userId), parseStoredEvents, EMPTY_EVENTS);

  const addEvent = useCallback(
    (draft: EventDraft) => update((current) => [...current, { ...draft, id: createEventId() }]),
    [update],
  );

  const updateEvent = useCallback(
    (event: CalendarEvent) => update((current) => current.map((e) => (e.id === event.id ? event : e))),
    [update],
  );

  const deleteEvent = useCallback(
    (id: string) => update((current) => current.filter((e) => e.id !== id)),
    [update],
  );

  return { events, addEvent, updateEvent, deleteEvent };
}
