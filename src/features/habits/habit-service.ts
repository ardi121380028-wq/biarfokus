import type { Habit, DayCheckin, HabitStats, HeatmapDay, RoutineTime } from "./habit-types.ts";
import type { CalendarEvent, Task } from "../../types/domain.ts";
import { getCalendarStorageKey, parseStoredEvents } from "../calendar/calendar-service.ts";
import { LOCAL_TASKS_KEY, loadLocalTasks } from "../tasks/task-service.ts";

export const HABIT_STORAGE_KEY = "biarfokus.habits_v1";

/**
 * Formats a Date object into local YYYY-MM-DD string
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayKey(): string {
  return formatDateKey(new Date());
}

/**
 * Shifts a date string by a given number of days
 */
export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const parts = dateKey.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + deltaDays);
  return formatDateKey(d);
}

/**
 * Calculate streak and detect James Clear's "Never Miss Twice" danger zone.
 */
export function calculateStreak(
  completedDates: string[],
  referenceDate = new Date()
): { current: number; best: number; missedYesterday: boolean; isAtRiskOfMissingTwice: boolean } {
  if (!completedDates || completedDates.length === 0) {
    return { current: 0, best: 0, missedYesterday: false, isAtRiskOfMissingTwice: false };
  }

  const set = new Set(completedDates);
  const todayKey = formatDateKey(referenceDate);
  const yesterdayKey = shiftDateKey(todayKey, -1);
  const twoDaysAgoKey = shiftDateKey(todayKey, -2);

  const doneToday = set.has(todayKey);
  const doneYesterday = set.has(yesterdayKey);
  const doneTwoDaysAgo = set.has(twoDaysAgoKey);

  // James Clear Rule: "Never miss twice".
  // If yesterday was missed, but 2 days ago was completed, and today not yet completed:
  // User is at imminent risk of breaking the rule!
  const isAtRiskOfMissingTwice = !doneToday && !doneYesterday && doneTwoDaysAgo;

  let current = 0;
  let checkDate = doneToday ? todayKey : yesterdayKey;

  // Count backwards consecutively
  while (set.has(checkDate)) {
    current += 1;
    checkDate = shiftDateKey(checkDate, -1);
  }

  // Calculate best all-time streak across all sorted dates
  const sorted = Array.from(set).sort();
  let best = 0;
  let run = 0;
  let prevDate = "";

  for (const d of sorted) {
    if (!prevDate) {
      run = 1;
    } else {
      const expected = shiftDateKey(prevDate, 1);
      if (d === expected) {
        run += 1;
      } else {
        run = 1;
      }
    }
    if (run > best) best = run;
    prevDate = d;
  }

  if (current > best) best = current;

  return {
    current,
    best,
    missedYesterday: !doneYesterday && !doneToday,
    isAtRiskOfMissingTwice,
  };
}

/**
 * Toggles completion status for a specific date on a habit
 */
export function toggleHabitDate(habit: Habit, dateKey: string): Habit {
  const set = new Set(habit.completedDates);
  if (set.has(dateKey)) {
    set.delete(dateKey);
  } else {
    set.add(dateKey);
  }

  const nextDates = Array.from(set).sort();
  const streaks = calculateStreak(nextDates);

  return {
    ...habit,
    completedDates: nextDates,
    streakCurrent: streaks.current,
    streakBest: Math.max(habit.streakBest, streaks.best),
  };
}

/**
 * Returns rolling 7 days for quick weekly strip (Monday to Sunday)
 */
export function getWeeklyStrip(habit: Habit, referenceDate = new Date()): DayCheckin[] {
  const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const todayKey = formatDateKey(referenceDate);

  // Find Monday of the current week (Monday-first)
  const currentDayOfWeek = referenceDate.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + distanceToMonday);

  const days: DayCheckin[] = [];
  const compSet = new Set(habit.completedDates);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateKey = formatDateKey(d);

    days.push({
      date: dateKey,
      dayName: DAY_NAMES[d.getDay()],
      dayNumber: d.getDate(),
      isToday: dateKey === todayKey,
      isFuture: dateKey > todayKey,
      completed: compSet.has(dateKey),
    });
  }

  return days;
}

/**
 * Builds a GitHub-style consistency heatmap for the last N days (default: 84 days / 12 weeks)
 */
export function buildConsistencyHeatmap(habits: Habit[], daysCount = 84, referenceDate = new Date()): HeatmapDay[] {
  const todayKey = formatDateKey(referenceDate);
  const dateCounts: Record<string, number> = {};

  const activeHabits = habits.filter((h) => !h.archived);
  for (const h of activeHabits) {
    for (const d of h.completedDates) {
      dateCounts[d] = (dateCounts[d] || 0) + 1;
    }
  }

  const result: HeatmapDay[] = [];
  const maxHabits = Math.max(1, activeHabits.length);

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(referenceDate.getDate() - i);
    const key = formatDateKey(d);
    const count = dateCounts[key] || 0;

    // Intensity levels 0 to 4
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) {
      const ratio = count / maxHabits;
      if (ratio >= 0.75) level = 4;
      else if (ratio >= 0.5) level = 3;
      else if (ratio >= 0.25) level = 2;
      else level = 1;
    }

    result.push({
      date: key,
      count,
      level,
      isToday: key === todayKey,
    });
  }

  return result;
}

/**
 * Computes high-level aggregated habit statistics
 */
export function calculateHabitStats(habits: Habit[], todayKey = getTodayKey()): HabitStats {
  const active = habits.filter((h) => !h.archived);
  const totalHabits = active.length;

  let completedTodayCount = 0;
  let bestCurrentStreak = 0;
  let allTimeCheckins = 0;
  let neverMissTwiceAlerts = 0;

  for (const h of active) {
    allTimeCheckins += h.completedDates.length;
    if (h.completedDates.includes(todayKey)) {
      completedTodayCount += 1;
    }
    if (h.streakCurrent > bestCurrentStreak) {
      bestCurrentStreak = h.streakCurrent;
    }

    const streakInfo = calculateStreak(h.completedDates);
    if (streakInfo.isAtRiskOfMissingTwice) {
      neverMissTwiceAlerts += 1;
    }
  }

  const todayRatePercent = totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;

  return {
    totalHabits,
    completedTodayCount,
    todayRatePercent,
    bestCurrentStreak,
    allTimeCheckins,
    neverMissTwiceAlerts,
  };
}

/**
 * Curated initial default habits rooted in Atomic Habits science
 */
export const DEFAULT_HABITS: Habit[] = [
  {
    id: "habit-pomodoro",
    title: "Fokus 1 Sesi Pomodoro (25 Menit)",
    cue: "Setelah merapikan meja kerja & menyeduh kopi",
    identity: "Saya adalah orang yang fokus dan menyelesaikan hal terpenting.",
    twoMinuteRule: "Cukup duduk di meja dan nyalakan timer 5 menit pertama.",
    routineTime: "afternoon",
    frequency: "daily",
    targetCount: 1,
    unit: "sesi",
    color: "#ef4444",
    icon: "🍅",
    linkedPomodoroMinutes: 25,
    completedDates: [],
    streakCurrent: 0,
    streakBest: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "habit-calendar",
    title: "Time-Blocking Rencana Hari Ini",
    cue: "Setelah bangun tidur dan cek catatan prioritas",
    identity: "Saya adalah pemilik waktu saya, bukan budak distraksi.",
    twoMinuteRule: "Buka Kalender BiarFokus dan isi 2 blok waktu utama.",
    routineTime: "morning",
    frequency: "daily",
    targetCount: 1,
    unit: "jadwal",
    color: "#3b82f6",
    icon: "📅",
    completedDates: [],
    streakCurrent: 0,
    streakBest: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "habit-reading",
    title: "Membaca Buku 5-10 Halaman",
    cue: "Setelah sarapan pagi",
    identity: "Saya adalah pembelajar konsisten yang berkembang 1% setiap hari.",
    twoMinuteRule: "Buka buku dan baca minimal 1 halaman saja.",
    routineTime: "morning",
    frequency: "daily",
    targetCount: 1,
    unit: "halaman",
    color: "#10b981",
    icon: "📚",
    completedDates: [],
    streakCurrent: 0,
    streakBest: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "habit-frog",
    title: "Eat That Frog: Bereskan 1 Tugas Terberat",
    cue: "Setelah meninjau board Kanban tim",
    identity: "Saya selalu mendahulukan hal yang berdampak besar.",
    twoMinuteRule: "Pilih 1 kartu tugas 'Frog' dan cicil langkah pertamanya.",
    routineTime: "morning",
    frequency: "daily",
    targetCount: 1,
    unit: "tugas",
    color: "#f59e0b",
    icon: "🐸",
    completedDates: [],
    streakCurrent: 0,
    streakBest: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "habit-reflection",
    title: "Refleksi & Catat 3 Hal Yang Disyukuri",
    cue: "Setelah mematikan monitor kerja di malam hari",
    identity: "Saya orang yang penuh rasa syukur dan menjaga kedamaian batin.",
    twoMinuteRule: "Buka Catatan Cepat Keep dan tulis 1 kalimat sederhana.",
    routineTime: "evening",
    frequency: "daily",
    targetCount: 1,
    unit: "catatan",
    color: "#6366f1",
    icon: "✍️",
    completedDates: [],
    streakCurrent: 0,
    streakBest: 0,
    createdAt: new Date().toISOString(),
  },
];

/**
 * LocalStorage storage helpers
 */
export function loadLocalHabits(): Habit[] {
  if (typeof window === "undefined") return DEFAULT_HABITS;
  try {
    const raw = window.localStorage.getItem(HABIT_STORAGE_KEY);
    if (!raw) return DEFAULT_HABITS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_HABITS;

    // Recalculate streaks on load to ensure current streak matches today
    return parsed.map((h: Habit) => {
      const streakInfo = calculateStreak(h.completedDates || []);
      return {
        ...h,
        streakCurrent: streakInfo.current,
        streakBest: Math.max(h.streakBest || 0, streakInfo.best),
      };
    });
  } catch (err) {
    console.error("Failed to parse stored habits:", err);
    return DEFAULT_HABITS;
  }
}

export function saveLocalHabits(habits: Habit[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
  } catch (err) {
    console.error("Failed to save habits to localStorage:", err);
  }
}

/**
 * Safely reorders items in an array of habits
 */
export function reorderHabitsList(habits: Habit[], fromIndex: number, toIndex: number): Habit[] {
  if (
    fromIndex < 0 ||
    fromIndex >= habits.length ||
    toIndex < 0 ||
    toIndex >= habits.length ||
    fromIndex === toIndex
  ) {
    return habits;
  }
  const clone = [...habits];
  const [moved] = clone.splice(fromIndex, 1);
  clone.splice(toIndex, 0, moved);
  return clone;
}


/**
 * Maps a habit into a CalendarEvent draft for today
 */
export function buildHabitCalendarEvent(habit: Habit, dateStr = getTodayKey()): Omit<CalendarEvent, "id"> {
  let startTime = "08:00";
  if (habit.routineTime === "morning") startTime = "07:30";
  else if (habit.routineTime === "afternoon") startTime = "13:00";
  else if (habit.routineTime === "evening") startTime = "19:30";
  else startTime = "09:00";

  const durationMin = habit.linkedPomodoroMinutes && habit.linkedPomodoroMinutes > 0 ? habit.linkedPomodoroMinutes : 30;

  const [startH, startM] = startTime.split(":").map(Number);
  const totalEndM = startH * 60 + startM + durationMin;
  const endH = Math.min(23, Math.floor(totalEndM / 60));
  const endM = totalEndM % 60;
  const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

  const descriptionParts: string[] = [];
  if (habit.cue) descriptionParts.push(`Pemicu: ${habit.cue}`);
  if (habit.identity) descriptionParts.push(`Identitas: ${habit.identity}`);
  if (habit.twoMinuteRule) descriptionParts.push(`Aturan 2 Menit: ${habit.twoMinuteRule}`);

  return {
    title: `${habit.icon ? habit.icon + " " : ""}${habit.title}`,
    date: dateStr,
    startTime,
    endTime,
    color: habit.color || "#6366f1",
    category: "task",
    description: descriptionParts.length > 0 ? descriptionParts.join("\n") : undefined,
  };
}

/**
 * Builds an Eat That Frog task from a habit
 */
export function buildHabitFrogTask(habit: Habit, id = `task-habit-${Date.now()}`): Task {
  const pomodoros = habit.linkedPomodoroMinutes && habit.linkedPomodoroMinutes >= 25
    ? Math.max(1, Math.round(habit.linkedPomodoroMinutes / 25))
    : 1;

  return {
    id,
    title: habit.title,
    done: false,
    pomodoros,
  };
}

/**
 * Persists a habit to the Calendar (localStorage + optional Supabase cloud)
 */
export async function addHabitToCalendar(
  habit: Habit,
  userId?: string | null,
  dateStr = getTodayKey()
): Promise<CalendarEvent> {
  const draft = buildHabitCalendarEvent(habit, dateStr);
  const newEvent: CalendarEvent = {
    ...draft,
    id: `ev-habit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };

  if (typeof window !== "undefined") {
    try {
      const storageKey = getCalendarStorageKey(userId);
      const raw = window.localStorage.getItem(storageKey);
      const existing = parseStoredEvents(raw);
      const updated = [...existing, newEvent];
      window.localStorage.setItem(storageKey, JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("biarfokus:calendar-updated", { detail: newEvent }));
    } catch (err) {
      console.warn("Failed to save habit event to localStorage:", err);
    }

    if (userId) {
      try {
        const { getSupabaseBrowserClient } = await import("../../lib/supabase/client");
        const { upsertCloudEvent } = await import("../calendar/calendar-cloud");
        const supabase = getSupabaseBrowserClient();
        await upsertCloudEvent(supabase, userId, newEvent);
      } catch (err) {
        console.warn("Failed to upload habit event to cloud calendar:", err);
      }
    }
  }

  return newEvent;
}

/**
 * Persists a habit as the #1 Eat That Frog task in the task list
 */
export async function addHabitAsFrogTask(
  habit: Habit,
  userId?: string | null
): Promise<Task> {
  const frogTask = buildHabitFrogTask(habit, typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}`);

  if (typeof window !== "undefined") {
    let createdTask = frogTask;

    if (userId) {
      try {
        const { getSupabaseBrowserClient } = await import("../../lib/supabase/client");
        const { createTask, saveCloudTaskOrder } = await import("../tasks/task-service");
        const supabase = getSupabaseBrowserClient();
        const serverTask = await createTask(supabase, userId, habit.title);
        createdTask = { ...serverTask, pomodoros: frogTask.pomodoros };

        const existing = loadLocalTasks();
        const active = existing.filter((t) => !t.done && t.id !== createdTask.id);
        const done = existing.filter((t) => t.done && t.id !== createdTask.id);
        const nextTasks = [createdTask, ...active, ...done];

        window.localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(nextTasks));
        void saveCloudTaskOrder(supabase, userId, nextTasks.map((t) => t.id)).catch(() => {});
      } catch (err) {
        const existing = loadLocalTasks();
        const active = existing.filter((t) => !t.done);
        const done = existing.filter((t) => t.done);
        const nextTasks = [createdTask, ...active, ...done];
        window.localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(nextTasks));
      }
    } else {
      const existing = loadLocalTasks();
      const active = existing.filter((t) => !t.done);
      const done = existing.filter((t) => t.done);
      const nextTasks = [createdTask, ...active, ...done];
      window.localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(nextTasks));
    }

    window.dispatchEvent(new CustomEvent("biarfokus:frog-task-added", { detail: createdTask }));
    window.dispatchEvent(new Event("storage"));
    return createdTask;
  }

  return frogTask;
}
