"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export type CalendarSyncStatus = "synced" | "saving" | "offline" | "error";

const MAX_TOMBSTONES = 200;

function getDeletedEventIds(userId?: string | null): Set<string> {
  if (typeof window === "undefined" || !userId) return new Set();
  try {
    const raw = window.localStorage.getItem(`biarfokus.calendar.deleted_ids.${userId}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function markEventDeleted(userId: string | undefined | null, eventId: string) {
  if (typeof window === "undefined" || !userId) return;
  try {
    const existing = getDeletedEventIds(userId);
    existing.add(eventId);
    const array = Array.from(existing).slice(-MAX_TOMBSTONES);
    window.localStorage.setItem(`biarfokus.calendar.deleted_ids.${userId}`, JSON.stringify(array));
  } catch {}
}

function migrateGuestEvents(userId: string): CalendarEvent[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const guestKey = "biarfokus.calendar_events.guest";
    const raw = window.localStorage.getItem(guestKey);
    if (!raw) return [];
    const parsed = parseStoredEvents(raw);
    if (parsed.length > 0) {
      window.localStorage.removeItem(guestKey);
      return parsed;
    }
  } catch {}
  return [];
}

export function useCalendarEvents(userId?: string | null) {
  const [events, update] = useLocalStoreValue(getCalendarStorageKey(userId), parseStoredEvents, EMPTY_EVENTS);
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus>(userId ? "saving" : "offline");
  const syncInProgressRef = useRef(false);

  // Core Bidirectional Cloud Sync
  const performCloudSync = useCallback(async () => {
    if (!userId) {
      setSyncStatus("offline");
      return;
    }
    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;
    setSyncStatus("saving");

    try {
      const supabase = getSupabaseBrowserClient();

      // Check for any guest events left from before login on this device
      const guestEvents = migrateGuestEvents(userId);

      const cloudEvents = await loadCloudEvents(supabase, userId);
      const deletedIds = getDeletedEventIds(userId);
      const activeCloud = cloudEvents.filter((e) => !deletedIds.has(e.id));
      const cloudMap = new Map(activeCloud.map((e) => [e.id, e]));

      update((currentLocal) => {
        // Merge current local + any migrated guest events
        const combinedLocal = [...currentLocal, ...guestEvents];

        // Find unsynced local events (present locally, but not yet in cloud, and not deleted)
        const unsynced = combinedLocal.filter((e) => !cloudMap.has(e.id) && !deletedIds.has(e.id));

        // Upload any unsynced local events to the cloud so mobile and desktop stay in sync
        if (unsynced.length > 0) {
          for (const ev of unsynced) {
            void upsertCloudEvent(supabase, userId, ev).catch((err) => {
              console.warn("[BiarFokus Calendar] Failed to upload unsynced event:", ev.id, err);
            });
          }
        }

        // Merge cloud events with unsynced local events
        const mergedMap = new Map<string, CalendarEvent>();
        for (const ev of activeCloud) {
          mergedMap.set(ev.id, ev);
        }
        for (const ev of unsynced) {
          mergedMap.set(ev.id, ev);
        }

        return Array.from(mergedMap.values());
      });

      setSyncStatus("synced");
    } catch (err) {
      console.warn("[BiarFokus Calendar] Cloud sync error:", err);
      setSyncStatus("error");
    } finally {
      syncInProgressRef.current = false;
    }
  }, [userId, update]);

  // Real-time synchronization + Mount + Window/Tab Focus
  useEffect(() => {
    if (!userId) {
      setSyncStatus("offline");
      return;
    }

    let isCancelled = false;
    let supabase: ReturnType<typeof getSupabaseBrowserClient>;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      setSyncStatus("offline");
      return;
    }

    // 1. Initial sync on mount or auth change
    void performCloudSync();

    // 2. Real-time Supabase postgres_changes channel
    const channelName = `calendar_realtime_${userId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calendar_events",
        },
        () => {
          if (!isCancelled) {
            void performCloudSync();
          }
        },
      )
      .subscribe();

    // 3. Tab visibility and window focus listeners (e.g. mobile browser returns from sleep/background)
    function handleFocusOrVisibility() {
      if (document.visibilityState === "visible" && !isCancelled) {
        void performCloudSync();
      }
    }

    window.addEventListener("focus", handleFocusOrVisibility);
    document.addEventListener("visibilitychange", handleFocusOrVisibility);

    return () => {
      isCancelled = true;
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocusOrVisibility);
      document.removeEventListener("visibilitychange", handleFocusOrVisibility);
    };
  }, [userId, performCloudSync]);

  const addEvent = useCallback(
    (draft: EventDraft) => {
      const event: CalendarEvent = { ...draft, id: createEventId() };
      update((current) => [...current, event]);
      if (userId) {
        setSyncStatus("saving");
        try {
          const supabase = getSupabaseBrowserClient();
          upsertCloudEvent(supabase, userId, event)
            .then(() => setSyncStatus("synced"))
            .catch((err) => {
              console.warn("Failed to sync created calendar event to cloud:", err);
              setSyncStatus("error");
            });
        } catch {
          setSyncStatus("error");
        }
      }
      return event;
    },
    [userId, update],
  );

  const updateEvent = useCallback(
    (event: CalendarEvent) => {
      update((current) => current.map((e) => (e.id === event.id ? event : e)));
      if (userId) {
        setSyncStatus("saving");
        try {
          const supabase = getSupabaseBrowserClient();
          upsertCloudEvent(supabase, userId, event)
            .then(() => setSyncStatus("synced"))
            .catch((err) => {
              console.warn("Failed to sync calendar event update to cloud:", err);
              setSyncStatus("error");
            });
        } catch {
          setSyncStatus("error");
        }
      }
    },
    [userId, update],
  );

  const deleteEvent = useCallback(
    (id: string) => {
      markEventDeleted(userId, id);
      update((current) => current.filter((e) => e.id !== id));
      if (userId) {
        setSyncStatus("saving");
        try {
          const supabase = getSupabaseBrowserClient();
          deleteCloudEvent(supabase, userId, id)
            .then(() => setSyncStatus("synced"))
            .catch((err) => {
              console.warn("Failed to sync calendar event delete to cloud:", err);
              setSyncStatus("error");
            });
        } catch {
          setSyncStatus("error");
        }
      }
    },
    [userId, update],
  );

  return { events, addEvent, updateEvent, deleteEvent, syncStatus, forceSync: performCloudSync };
}
