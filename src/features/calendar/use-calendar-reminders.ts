"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { CalendarEvent } from "@/types/domain";
import { isEventOccurringOnDate, timeToMinutes, toISODate } from "./calendar-service";
import { playCalendarReminderChime } from "@/features/audio/alarm-sound";

export type CalendarReminderMilestone = "10m" | "start";

export type ActiveCalendarReminder = {
  event: CalendarEvent;
  milestone: CalendarReminderMilestone;
  diffMinutes: number;
  timestamp: number;
};

export interface UseCalendarRemindersOptions {
  events: CalendarEvent[];
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
}

const STORAGE_KEY_PREFIX = "biarfokus.calendar_notified.";

function getNotifiedSet(dateStr: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${dateStr}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function recordNotified(dateStr: string, reminderKey: string) {
  if (typeof window === "undefined") return;
  try {
    const set = getNotifiedSet(dateStr);
    set.add(reminderKey);
    window.sessionStorage.setItem(
      `${STORAGE_KEY_PREFIX}${dateStr}`,
      JSON.stringify(Array.from(set))
    );
  } catch {}
}

export function useCalendarReminders({
  events,
  notificationsEnabled = true,
  soundEnabled = true,
}: UseCalendarRemindersOptions) {
  const [activeReminder, setActiveReminder] = useState<ActiveCalendarReminder | null>(null);
  const memoryNotifiedRef = useRef<Set<string>>(new Set());

  const dismissReminder = useCallback(() => {
    setActiveReminder(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkReminders = () => {
      const now = new Date();
      const todayIso = toISODate(now);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Find events occurring today (including recurring projections)
      const todayEvents = events.filter((ev) => isEventOccurringOnDate(ev, todayIso));

      for (const ev of todayEvents) {
        const startMinutes = timeToMinutes(ev.startTime);
        const diff = startMinutes - currentMinutes;

        // Key identifiers
        const key10m = `${ev.id}_${todayIso}_10m`;
        const keyStart = `${ev.id}_${todayIso}_start`;
        const sessionSet = getNotifiedSet(todayIso);

        // 1. Check 10-minute warning (between 1 and 10 minutes ahead)
        if (
          diff > 0 &&
          diff <= 10 &&
          !memoryNotifiedRef.current.has(key10m) &&
          !sessionSet.has(key10m)
        ) {
          memoryNotifiedRef.current.add(key10m);
          recordNotified(todayIso, key10m);

          // Audio chime
          if (soundEnabled) {
            playCalendarReminderChime();
          }

          // Native Web Notification
          if (
            notificationsEnabled &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification(`📅 Jadwal: ${ev.title}`, {
                body: `Mulai dalam ${diff} menit (${ev.startTime} - ${ev.endTime})${ev.description ? `\n${ev.description}` : ""}`,
              });
            } catch {}
          }

          // In-App Toast
          setActiveReminder({
            event: ev,
            milestone: "10m",
            diffMinutes: diff,
            timestamp: Date.now(),
          });
          break; // Show one reminder at a time
        }

        // 2. Check start warning (when diff is 0 or just started within 1 minute)
        if (
          diff <= 0 &&
          diff >= -1 &&
          !memoryNotifiedRef.current.has(keyStart) &&
          !sessionSet.has(keyStart)
        ) {
          memoryNotifiedRef.current.add(keyStart);
          recordNotified(todayIso, keyStart);

          // Audio chime
          if (soundEnabled) {
            playCalendarReminderChime();
          }

          // Native Web Notification
          if (
            notificationsEnabled &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification(`🔔 Waktunya: ${ev.title}`, {
                body: `Jadwal dimulai sekarang (${ev.startTime} - ${ev.endTime})${ev.description ? `\n${ev.description}` : ""}`,
              });
            } catch {}
          }

          // In-App Toast
          setActiveReminder({
            event: ev,
            milestone: "start",
            diffMinutes: 0,
            timestamp: Date.now(),
          });
          break;
        }
      }
    };

    // Run immediately on mount or dependency change
    checkReminders();

    // Check periodically every 15 seconds
    const interval = window.setInterval(checkReminders, 15000);
    return () => window.clearInterval(interval);
  }, [events, notificationsEnabled, soundEnabled]);

  // Auto-dismiss active toast reminder after 14 seconds
  useEffect(() => {
    if (!activeReminder) return;
    const timer = window.setTimeout(() => {
      setActiveReminder(null);
    }, 14000);
    return () => window.clearTimeout(timer);
  }, [activeReminder]);

  return { activeReminder, dismissReminder };
}
