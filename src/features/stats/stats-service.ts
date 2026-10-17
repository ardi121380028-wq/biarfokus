import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyFocus, StatsRange, StatsSummary } from "../../types/domain";

export const STATS_HISTORY_DAYS = 366;

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(day: string): Date {
  if (!DAY_PATTERN.test(day)) {
    throw new Error(`Format tanggal tidak valid: ${day}`);
  }
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date));
}

/** Formats a Date as YYYY-MM-DD using the viewer's local calendar. */
export function formatLocalDay(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Moves a YYYY-MM-DD calendar day by whole days (DST-safe, no time-of-day involved). */
export function shiftDay(day: string, delta: number): string {
  const date = parseDay(day);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

/** Monday = 0 ... Sunday = 6. */
export function getWeekdayIndex(day: string): number {
  return (parseDay(day).getUTCDay() + 6) % 7;
}

export function getRangeDays(range: StatsRange, today: string): string[] {
  if (range === "week") {
    const weekStart = shiftDay(today, -getWeekdayIndex(today));
    return Array.from({ length: 7 }, (_, index) => shiftDay(weekStart, index));
  }
  const length = range === "7d" ? 7 : 30;
  const start = shiftDay(today, -(length - 1));
  return Array.from({ length }, (_, index) => shiftDay(start, index));
}

export function summarizeRange(
  daily: DailyFocus[],
  range: StatsRange,
  today: string,
): StatsSummary {
  const byDay = new Map(daily.map((entry) => [entry.day, entry]));
  const series = getRangeDays(range, today).map((day) => ({
    day,
    focusSeconds: byDay.get(day)?.focusSeconds ?? 0,
  }));
  const pomodoroCount = getRangeDays(range, today).reduce(
    (total, day) => total + (byDay.get(day)?.pomodoroCount ?? 0),
    0,
  );
  const focusSeconds = series.reduce((total, entry) => total + entry.focusSeconds, 0);
  return { focusSeconds, pomodoroCount, series };
}

/**
 * Current streak counts consecutive days with at least one completed pomodoro.
 * A streak is not broken until the day ends, so "yesterday" still counts when
 * nothing has been completed today yet.
 */
export function calculateStreaks(
  daily: DailyFocus[],
  today: string,
): { current: number; longest: number } {
  const activeDays = new Set(
    daily.filter((entry) => entry.pomodoroCount > 0).map((entry) => entry.day),
  );

  let current = 0;
  let cursor = activeDays.has(today) ? today : shiftDay(today, -1);
  while (activeDays.has(cursor)) {
    current += 1;
    cursor = shiftDay(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of [...activeDays].sort()) {
    run = previous !== null && shiftDay(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }

  return { current, longest };
}

export function mapDailyFocusRow(row: unknown): DailyFocus {
  if (typeof row !== "object" || row === null) {
    throw new Error("Data statistik harian tidak valid.");
  }
  const record = row as Record<string, unknown>;
  const day = typeof record.day === "string" ? record.day.slice(0, 10) : "";
  const focusSeconds = Number(record.focus_seconds);
  const pomodoroCount = Number(record.pomodoro_count);
  if (
    !DAY_PATTERN.test(day) ||
    !Number.isFinite(focusSeconds) ||
    !Number.isFinite(pomodoroCount)
  ) {
    throw new Error("Data statistik harian tidak valid.");
  }
  return { day, focusSeconds, pomodoroCount };
}

export function dailyFocusToCsv(daily: DailyFocus[]): string {
  const header = "tanggal,fokus_detik,fokus_menit,pomodoro_selesai";
  const rows = [...daily]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map(
      (entry) =>
        `${entry.day},${entry.focusSeconds},${Math.round(entry.focusSeconds / 60)},${entry.pomodoroCount}`,
    );
  return [header, ...rows].join("\n");
}

export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/**
 * Daily totals are aggregated in the database (see get_daily_focus) in the
 * viewer's timezone, so the payload is at most one row per day regardless of
 * how many sessions the user has completed.
 */
export async function loadDailyFocus(
  supabase: SupabaseClient,
  timezone: string,
): Promise<DailyFocus[]> {
  const { data, error } = await supabase.rpc("get_daily_focus", {
    p_days: STATS_HISTORY_DAYS,
    p_timezone: timezone,
  });
  if (error) throw error;
  const rows: unknown[] = data ?? [];
  return rows.map(mapDailyFocusRow);
}
