import type { CalendarEvent } from "../../types/domain.ts";

export const CALENDAR_STORAGE_PREFIX = "biarfokus.calendar_events.";

export const CALENDAR_COLORS = [
  { name: "Tomato (Merah)", hex: "#d93025" },
  { name: "Grape (Ungu)", hex: "#8e24aa" },
  { name: "Peacock (Biru Langit)", hex: "#039be5" },
  { name: "Basil (Hijau)", hex: "#0b8043" },
  { name: "Blueberry (Biru Tua)", hex: "#3f51b5" },
  { name: "Flamingo (Pink)", hex: "#e67c73" },
  { name: "Tangerine (Oranye)", hex: "#f4511e" },
  { name: "Banana (Kuning)", hex: "#f6bf26" },
];

export const GRID_START_HOUR = 6; // 06:00
export const GRID_END_HOUR = 23; // 23:00
export const HOUR_HEIGHT_PX = 60; // 60px per hour

export function formatDateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatReadableDate(d: Date): string {
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getInitialCalendarEvents(todayDateStr: string): CalendarEvent[] {
  return [
    {
      id: "event-work-zitline",
      title: "Working Z",
      date: todayDateStr,
      startTime: "08:00",
      endTime: "16:00",
      color: "#d93025",
      category: "event",
      description: "Deep work & fokus penyelesaian prioritas hari ini.",
      linkedNoteId: "sample_note_work_zitline",
      linkedNoteTitle: "Todolist Bismillah - Work Zitline",
    },
    {
      id: "event-workout-learn",
      title: "Workout and Learn",
      date: todayDateStr,
      startTime: "16:00",
      endTime: "18:00",
      color: "#8e24aa",
      category: "event",
      description: "Olahraga rutin & membaca / eksplorasi skill baru.",
    },
    {
      id: "event-rest-break",
      title: "rest, break, religi",
      date: todayDateStr,
      startTime: "18:00",
      endTime: "19:30",
      color: "#039be5",
      category: "event",
      description: "Makan malam, sholat, dan istirahat sejenak.",
    },
    {
      id: "event-business",
      title: "Business",
      date: todayDateStr,
      startTime: "19:30",
      endTime: "20:30",
      color: "#0b8043",
      category: "task",
      description: "Review metrik dan perencanaan bisnis.",
    },
    {
      id: "event-crucial-grow",
      title: "Crucial Time To Grow",
      date: todayDateStr,
      startTime: "20:30",
      endTime: "22:00",
      color: "#3f51b5",
      category: "task",
      description: "Waktu krusial untuk evaluasi diri dan persiapan besok.",
    },
  ];
}

export function getCalendarStorageKey(userId?: string | null): string {
  return `${CALENDAR_STORAGE_PREFIX}${userId || "guest"}`;
}

export function loadCalendarEvents(userId?: string | null): CalendarEvent[] {
  const todayStr = formatDateToISO(new Date());
  if (typeof window === "undefined") {
    return getInitialCalendarEvents(todayStr);
  }
  try {
    const raw = window.localStorage.getItem(getCalendarStorageKey(userId));
    if (!raw) return getInitialCalendarEvents(todayStr);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return getInitialCalendarEvents(todayStr);
    }
    return parsed.map((ev: any) => ({
      id: ev.id || `event_${Date.now()}`,
      title: ev.title || "Tanpa Judul",
      date: ev.date || todayStr,
      startTime: ev.startTime || "09:00",
      endTime: ev.endTime || "10:00",
      color: ev.color || CALENDAR_COLORS[0].hex,
      category: ev.category === "task" ? "task" : "event",
      description: ev.description || "",
      linkedNoteId: ev.linkedNoteId || undefined,
      linkedNoteTitle: ev.linkedNoteTitle || undefined,
    }));
  } catch {
    return getInitialCalendarEvents(todayStr);
  }
}

export function saveCalendarEvents(
  events: CalendarEvent[],
  userId?: string | null
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getCalendarStorageKey(userId), JSON.stringify(events));
  } catch {
    // Ignore storage quota errors
  }
}

export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map((v) => Number.parseInt(v, 10) || 0);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function calculateEventPosition(
  startTime: string,
  endTime: string,
  gridStartHour = GRID_START_HOUR,
  hourHeight = HOUR_HEIGHT_PX
): { top: number; height: number } {
  const startMins = timeToMinutes(startTime);
  const endMins = Math.max(startMins + 15, timeToMinutes(endTime));
  const gridStartMins = gridStartHour * 60;

  const topMins = Math.max(0, startMins - gridStartMins);
  const durationMins = endMins - startMins;

  const top = (topMins / 60) * hourHeight;
  const height = Math.max(26, (durationMins / 60) * hourHeight);

  return { top, height };
}

export function getCurrentTimeIndicatorPosition(
  now: Date,
  gridStartHour = GRID_START_HOUR,
  hourHeight = HOUR_HEIGHT_PX
): number | null {
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const gridStartMins = gridStartHour * 60;
  const gridEndMins = (GRID_END_HOUR + 1) * 60;

  if (currentMins < gridStartMins || currentMins > gridEndMins) {
    return null;
  }

  const offsetMins = currentMins - gridStartMins;
  return (offsetMins / 60) * hourHeight;
}

export function getEventsForDate(
  events: CalendarEvent[],
  dateStr: string
): CalendarEvent[] {
  return events
    .filter((e) => e.date === dateStr)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}
