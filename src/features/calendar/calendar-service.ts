import type { CalendarEvent } from "../../types/domain.ts";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const CALENDAR_STORAGE_PREFIX = "biarfokus.calendar_events.";
export const HOUR_HEIGHT_PX = 48;
export const MINUTES_PER_DAY = 24 * 60;
export const MIN_EVENT_MINUTES = 15;
export const SLOT_STEP_MINUTES = 30;

export const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);

export function getCurrentTimeTop(now: Date, hourHeight = HOUR_HEIGHT_PX): number {
  const mins = now.getHours() * 60 + now.getMinutes();
  return (mins / 60) * hourHeight;
}

export type CalendarViewMode = "day" | "week" | "month" | "year";
export type EventDraft = Omit<CalendarEvent, "id">;

export const CALENDAR_COLORS = [
  { name: "Tomato", hex: "#d50000" },
  { name: "Flamingo", hex: "#e67c73" },
  { name: "Tangerine", hex: "#f4511e" },
  { name: "Banana", hex: "#f6bf26" },
  { name: "Sage", hex: "#33b679" },
  { name: "Basil", hex: "#0b8043" },
  { name: "Peacock", hex: "#039be5" },
  { name: "Blueberry", hex: "#3f51b5" },
  { name: "Lavender", hex: "#7986cb" },
  { name: "Grape", hex: "#8e24aa" },
  { name: "Graphite", hex: "#616161" },
] as const;

export const DEFAULT_EVENT_COLOR: string = CALENDAR_COLORS[6].hex;

/** Ids of demo events shipped by an earlier version. They are purged on load. */
const LEGACY_SEED_EVENT_IDS = new Set([
  "event-work-zitline",
  "event-workout-learn",
  "event-rest-break",
  "event-business",
  "event-crucial-grow",
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const HEX_RE = /^#[0-9a-f]{6}$/i;

/* ------------------------------------------------------------------ */
/* Date helpers (all local-time, no UTC drift)                         */
/* ------------------------------------------------------------------ */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, amount: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + amount);
}

/** Adds months while clamping the day (31 Jan + 1 month => 28/29 Feb). */
export function addMonths(d: Date, amount: number): Date {
  const firstOfTarget = new Date(d.getFullYear(), d.getMonth() + amount, 1);
  const lastDay = new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth() + 1, 0).getDate();
  return new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth(), Math.min(d.getDate(), lastDay));
}

export function addYears(d: Date, amount: number): Date {
  return new Date(d.getFullYear() + amount, d.getMonth(), d.getDate());
}

/** Week start: defaults to Sunday-first (0) matching Google Calendar standard. */
export function startOfWeek(d: Date, startOnSunday = true): Date {
  const day = d.getDay();
  const offset = startOnSunday ? day : (day + 6) % 7;
  return addDays(startOfDay(d), -offset);
}

/** Returns ISO week number (1..53). */
export function getWeekNumber(d: Date, startOnSunday = true): number {
  const ref = startOnSunday ? addDays(startOfWeek(d, true), 3) : d;
  const target = new Date(Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.getTime();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.getTime()) / 604800000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function getVisibleDays(anchor: Date, mode: CalendarViewMode, startOnSunday = true): Date[] {
  if (mode === "day") return [startOfDay(anchor)];
  if (mode === "week") {
    const start = startOfWeek(anchor, startOnSunday);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }
  if (mode === "month") {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = startOfWeek(first, startOnSunday);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const end = addDays(startOfWeek(last, startOnSunday), 6);
    const dayDiff = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const totalDays = dayDiff <= 35 ? 35 : 42;
    return Array.from({ length: totalDays }, (_, i) => addDays(start, i));
  }
  return [startOfDay(anchor)];
}

export type MonthCalendarWeek = {
  weekNumber: number;
  days: Date[];
};

export function getMonthCalendarWeeks(anchor: Date, startOnSunday = true): MonthCalendarWeek[] {
  const days = getVisibleDays(anchor, "month", startOnSunday);
  const weeks: MonthCalendarWeek[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    const midDay = chunk[startOnSunday ? 3 : 0] || chunk[0];
    weeks.push({
      weekNumber: getWeekNumber(midDay),
      days: chunk,
    });
  }
  return weeks;
}

export type YearCalendarMonth = {
  monthIndex: number;
  monthName: string;
  weeks: MonthCalendarWeek[];
};

export function getYearCalendarMonths(year: number, startOnSunday = true): YearCalendarMonth[] {
  return Array.from({ length: 12 }, (_, m) => {
    const anchor = new Date(year, m, 1);
    const monthName = anchor.toLocaleDateString("id-ID", { month: "long" });
    return {
      monthIndex: m,
      monthName,
      weeks: getMonthCalendarWeeks(anchor, startOnSunday),
    };
  });
}

/** 6x7 grid (42 days) for a mini month calendar. */
export function getMonthGrid(monthAnchor: Date, startOnSunday = true): Date[] {
  const first = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const start = startOfWeek(first, startOnSunday);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

const LOCALE = "id-ID";

export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
}

export function formatViewTitle(anchor: Date, mode: CalendarViewMode, startOnSunday = true): string {
  if (mode === "year") {
    return String(anchor.getFullYear());
  }
  if (mode === "month") {
    return formatMonthYear(anchor);
  }
  if (mode === "day") {
    return anchor.toLocaleDateString(LOCALE, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return formatMonthYear(anchor);
}

/** "12 – 18 Oktober 2026", "28 Sep – 4 Okt 2026", "29 Des 2026 – 4 Jan 2027". */
export function formatPeriodLabel(days: Date[]): string {
  if (days.length === 0) return "";
  const first = days[0];
  const last = days[days.length - 1];
  if (days.length === 1) {
    return first.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  if (first.getFullYear() !== last.getFullYear()) {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    return `${first.toLocaleDateString(LOCALE, opts)} – ${last.toLocaleDateString(LOCALE, opts)}`;
  }
  if (first.getMonth() !== last.getMonth()) {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${first.toLocaleDateString(LOCALE, opts)} – ${last.toLocaleDateString(LOCALE, opts)} ${last.getFullYear()}`;
  }
  return `${first.getDate()} – ${last.getDate()} ${formatMonthYear(last)}`;
}


/* ------------------------------------------------------------------ */
/* Time helpers                                                        */
/* ------------------------------------------------------------------ */

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

export function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map((v) => Number.parseInt(v, 10) || 0);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(MINUTES_PER_DAY - 1, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function snapMinutes(minutes: number, step = SLOT_STEP_MINUTES): number {
  return Math.max(0, Math.min(MINUTES_PER_DAY - step, Math.floor(minutes / step) * step));
}

export function formatDuration(startTime: string, endTime: string): string {
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (diff <= 0) return "";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h && m) return `${h} jam ${m} mnt`;
  if (h) return `${h} jam`;
  return `${m} mnt`;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export function validateEventDraft(draft: EventDraft): string | null {
  if (!draft.title.trim()) return "Judul jadwal wajib diisi.";
  if (!DATE_RE.test(draft.date)) return "Tanggal tidak valid.";
  if (!isValidTime(draft.startTime) || !isValidTime(draft.endTime)) return "Format jam tidak valid.";
  if (timeToMinutes(draft.endTime) <= timeToMinutes(draft.startTime)) {
    return "Jam selesai harus setelah jam mulai.";
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Layout: overlapping events are placed side-by-side (like GCal)      */
/* ------------------------------------------------------------------ */

export type PositionedEvent = {
  event: CalendarEvent;
  top: number;
  height: number;
  column: number;
  columns: number;
};

export function layoutDayEvents(events: CalendarEvent[], hourHeight = HOUR_HEIGHT_PX): PositionedEvent[] {
  const sorted = [...events].sort(
    (a, b) =>
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime) ||
      timeToMinutes(b.endTime) - timeToMinutes(a.endTime),
  );

  const result: PositionedEvent[] = [];
  let cluster: { event: CalendarEvent; start: number; end: number; column: number }[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const columns = Math.max(1, columnEnds.length);
    for (const item of cluster) {
      result.push({
        event: item.event,
        top: (item.start / 60) * hourHeight,
        height: ((item.end - item.start) / 60) * hourHeight,
        column: item.column,
        columns,
      });
    }
    cluster = [];
    columnEnds = [];
    clusterEnd = -1;
  };

  for (const event of sorted) {
    const start = timeToMinutes(event.startTime);
    const end = Math.min(MINUTES_PER_DAY, Math.max(timeToMinutes(event.endTime), start + MIN_EVENT_MINUTES));

    if (cluster.length > 0 && start >= clusterEnd) flush();

    let column = columnEnds.findIndex((columnEnd) => columnEnd <= start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[column] = end;
    }

    cluster.push({ event, start, end, column });
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();

  return result;
}

export function getEventsForDate(events: CalendarEvent[], isoDate: string): CalendarEvent[] {
  return events
    .filter((e) => e.date === isoDate)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

export const EMPTY_EVENTS: CalendarEvent[] = [];

export function getCalendarStorageKey(userId?: string | null): string {
  return `${CALENDAR_STORAGE_PREFIX}${userId || "guest"}`;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function normalizeEvent(raw: unknown): CalendarEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || LEGACY_SEED_EVENT_IDS.has(r.id)) return null;
  if (typeof r.date !== "string" || !DATE_RE.test(r.date)) return null;
  if (typeof r.startTime !== "string" || !isValidTime(r.startTime)) return null;
  if (typeof r.endTime !== "string" || !isValidTime(r.endTime)) return null;

  return {
    id: r.id,
    title: typeof r.title === "string" && r.title.trim() ? r.title : "(Tanpa judul)",
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    color: typeof r.color === "string" && HEX_RE.test(r.color) ? r.color : DEFAULT_EVENT_COLOR,
    category: r.category === "task" ? "task" : "event",
    description: optionalString(r.description),
    linkedNoteId: optionalString(r.linkedNoteId),
    linkedNoteTitle: optionalString(r.linkedNoteTitle),
    linkedItemId: optionalString(r.linkedItemId),
  };
}

/** Parses the raw localStorage value. Missing/corrupt data => empty calendar. */
export function parseStoredEvents(raw: string | null): CalendarEvent[] {
  if (!raw) return EMPTY_EVENTS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_EVENTS;
    return parsed.map(normalizeEvent).filter((e): e is CalendarEvent => e !== null);
  } catch {
    return EMPTY_EVENTS;
  }
}

export function createEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `event_${crypto.randomUUID()}`;
  }
  return `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
