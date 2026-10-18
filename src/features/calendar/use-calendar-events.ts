"use client";

import { useCallback, useEffect } from "react";
import type { CalendarEvent } from "@/types/domain";
import { useLocalStoreValue } from "@/lib/storage/local-store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deleteCloudEvent,
  loadCloudEvents,
  upsertCloudEvent,
} from "./calendar-cloud";
import {
  createEventId,
  EMPTY_EVENTS,
  getCalendarStorageKey,
  parseStoredEvents,
  type EventDraft,
} from "@/features/calendar/calendar-service";

export function useCalendarEvents(userId?: string | null) {
  const [events, update] = useLocalStoreValue(getCalendarStorageKey(userId), parseStoredEvents, EMPTY_EVENTS);

  // Cloud sync on mount when authenticated
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let supabase: ReturnType<typeof getSupabaseBrowserClient>;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      return;
    }

    void loadCloudEvents(supabase, userId)
      .then((cloudEvents) => {
        if (cancelled) return;
        if (cloudEvents.length > 0) {
          update(() => cloudEvents);
        }
      })
      .catch((err) => {
        console.warn("Cloud calendar sync unavailable; using local cache.", err);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, update]);

  const addEvent = useCallback(
    (draft: EventDraft) => {
      const event: CalendarEvent = { ...draft, id: createEventId() };
      update((current) => [...current, event]);
      if (userId) {
        try {
          upsertCloudEvent(getSupabaseBrowserClient(), userId, event).catch((err) =>
            console.warn("Failed to sync created calendar event to cloud:", err),
          );
        } catch {}
      }
      return event;
    },
    [userId, update],
  );

  const updateEvent = useCallback(
    (event: CalendarEvent) => {
      update((current) => current.map((e) => (e.id === event.id ? event : e)));
      if (userId) {
        try {
          upsertCloudEvent(getSupabaseBrowserClient(), userId, event).catch((err) =>
            console.warn("Failed to sync calendar event update to cloud:", err),
          );
        } catch {}
      }
    },
    [userId, update],
  );

  const deleteEvent = useCallback(
    (id: string) => {
      update((current) => current.filter((e) => e.id !== id));
      if (userId) {
        try {
          deleteCloudEvent(getSupabaseBrowserClient(), userId, id).catch((err) =>
            console.warn("Failed to sync calendar event delete to cloud:", err),
          );
        } catch {}
      }
    },
    [userId, update],
  );

  return { events, addEvent, updateEvent, deleteEvent };
}
