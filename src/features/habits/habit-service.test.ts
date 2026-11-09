import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateStreak,
  formatDateKey,
  shiftDateKey,
  toggleHabitDate,
  getWeeklyStrip,
  buildConsistencyHeatmap,
  calculateHabitStats,
  DEFAULT_HABITS,
  reorderHabitsList,
  buildHabitCalendarEvent,
  buildHabitFrogTask,
  mergeHabits,
} from "./habit-service.ts";
import type { Habit } from "./habit-types.ts";

describe("Habit Tracker Service & Behavioral Logic", () => {
  it("formats date keys properly as YYYY-MM-DD", () => {
    const d = new Date(2026, 9, 25); // Oct 25, 2026
    assert.equal(formatDateKey(d), "2026-10-25");
  });

  it("shifts date keys forwards and backwards accurately", () => {
    assert.equal(shiftDateKey("2026-10-25", 1), "2026-10-26");
    assert.equal(shiftDateKey("2026-10-25", -1), "2026-10-24");
    assert.equal(shiftDateKey("2026-10-01", -1), "2026-09-30");
  });

  it("calculates streak when completed today", () => {
    const today = new Date(2026, 9, 25);
    const completed = ["2026-10-23", "2026-10-24", "2026-10-25"];
    const res = calculateStreak(completed, today);
    assert.equal(res.current, 3);
    assert.equal(res.best, 3);
    assert.equal(res.missedYesterday, false);
    assert.equal(res.isAtRiskOfMissingTwice, false);
  });

  it("keeps streak alive when completed yesterday but not yet today", () => {
    const today = new Date(2026, 9, 25);
    const completed = ["2026-10-23", "2026-10-24"]; // not yet checked in today
    const res = calculateStreak(completed, today);
    assert.equal(res.current, 2); // still active!
    assert.equal(res.best, 2);
    assert.equal(res.missedYesterday, false);
    assert.equal(res.isAtRiskOfMissingTwice, false);
  });

  it("triggers James Clear 'Never Miss Twice' alert when yesterday was missed after a previous streak", () => {
    const today = new Date(2026, 9, 25);
    // completed 2 days ago (23rd), missed yesterday (24th), not yet done today (25th)
    const completed = ["2026-10-23"];
    const res = calculateStreak(completed, today);
    assert.equal(res.current, 0); // streak reset
    assert.equal(res.isAtRiskOfMissingTwice, true);
  });

  it("toggles dates and updates streaks properly", () => {
    const habit: Habit = {
      ...DEFAULT_HABITS[0],
      completedDates: ["2026-10-24"],
      streakCurrent: 1,
      streakBest: 1,
    };

    // Toggle today (2026-10-25)
    const updated = toggleHabitDate(habit, "2026-10-25");
    assert.ok(updated.completedDates.includes("2026-10-25"));

    // Untoggle
    const reverted = toggleHabitDate(updated, "2026-10-25");
    assert.ok(!reverted.completedDates.includes("2026-10-25"));
  });

  it("generates a 7-day weekly strip with correct Monday-first days", () => {
    const today = new Date(2026, 9, 25); // Sunday Oct 25, 2026
    const habit: Habit = {
      ...DEFAULT_HABITS[0],
      completedDates: ["2026-10-25"],
    };
    const strip = getWeeklyStrip(habit, today);
    assert.equal(strip.length, 7);
    assert.equal(strip[0].dayName, "Sen"); // Monday
    assert.equal(strip[6].dayName, "Min"); // Sunday
    assert.equal(strip[6].isToday, true);
    assert.equal(strip[6].completed, true);
  });

  it("builds consistency heatmap data with correct levels", () => {
    const habits: Habit[] = [
      { ...DEFAULT_HABITS[0], completedDates: ["2026-10-25", "2026-10-24"] },
      { ...DEFAULT_HABITS[1], completedDates: ["2026-10-25"] },
    ];
    const today = new Date(2026, 9, 25);
    const heatmap = buildConsistencyHeatmap(habits, 14, today);
    assert.equal(heatmap.length, 14);

    const todayCell = heatmap[heatmap.length - 1];
    assert.equal(todayCell.date, "2026-10-25");
    assert.equal(todayCell.count, 2);
    assert.equal(todayCell.level, 4); // 2/2 = 100%
  });

  it("aggregates high-level habit stats", () => {
    const habits: Habit[] = [
      { ...DEFAULT_HABITS[0], streakCurrent: 5, completedDates: ["2026-10-25"] },
      { ...DEFAULT_HABITS[1], streakCurrent: 2, completedDates: [] },
    ];
    const stats = calculateHabitStats(habits, "2026-10-25");
    assert.equal(stats.totalHabits, 2);
    assert.equal(stats.completedTodayCount, 1);
    assert.equal(stats.todayRatePercent, 50);
    assert.equal(stats.bestCurrentStreak, 5);
  });
  it("reorders habits safely up and down", () => {
    const list = [
      { ...DEFAULT_HABITS[0], id: "h1" },
      { ...DEFAULT_HABITS[1], id: "h2" },
      { ...DEFAULT_HABITS[2], id: "h3" },
    ];

    // Move h3 to top
    const reordered1 = reorderHabitsList(list, 2, 0);
    assert.deepEqual(reordered1.map(h => h.id), ["h3", "h1", "h2"]);

    // Move h1 to bottom
    const reordered2 = reorderHabitsList(list, 0, 2);
    assert.deepEqual(reordered2.map(h => h.id), ["h2", "h3", "h1"]);

    // Out of bounds preserves list
    const unchanged = reorderHabitsList(list, -1, 5);
    assert.equal(unchanged, list);
  });
  it("builds calendar event draft from habit with correct routine time & cues", () => {
    const habit = {
      ...DEFAULT_HABITS[0],
      title: "Baca Buku",
      icon: "📚",
      routineTime: "morning" as const,
      linkedPomodoroMinutes: 45,
      cue: "Setelah sarapan",
      identity: "Pembelajar",
      twoMinuteRule: "Baca 1 baris",
      color: "#10b981",
    };

    const eventDraft = buildHabitCalendarEvent(habit, "2026-11-05");
    assert.equal(eventDraft.title, "📚 Baca Buku");
    assert.equal(eventDraft.date, "2026-11-05");
    assert.equal(eventDraft.startTime, "07:30");
    assert.equal(eventDraft.endTime, "08:15");
    assert.equal(eventDraft.color, "#10b981");
    assert.equal(eventDraft.category, "task");
    assert.ok(eventDraft.description?.includes("Pemicu: Setelah sarapan"));
    assert.ok(eventDraft.description?.includes("Identitas: Pembelajar"));
  });

  it("builds Eat That Frog task from habit with proportional pomodoros", () => {
    const habit = {
      ...DEFAULT_HABITS[0],
      title: "Deep Work Penting",
      linkedPomodoroMinutes: 50,
    };

    const task = buildHabitFrogTask(habit, "task-frog-test");
    assert.equal(task.id, "task-frog-test");
    assert.equal(task.title, "Deep Work Penting");
    assert.equal(task.done, false);
    assert.equal(task.pomodoros, 2); // 50 / 25 = 2 pomodoros
  });

  it("merges habits across devices safely without losing check-ins or custom habits", () => {
    const local = [
      {
        ...DEFAULT_HABITS[0],
        id: "habit-1",
        title: "Teori",
        completedDates: ["2026-11-05", "2026-11-07"],
        streakCurrent: 1,
        streakBest: 2,
      },
      {
        ...DEFAULT_HABITS[1],
        id: "habit-local-only",
        title: "Tugas Baru di Android",
        completedDates: ["2026-11-07"],
        _isLocalDraft: true,
      },
    ];

    const cloud = [
      {
        ...DEFAULT_HABITS[0],
        id: "habit-1",
        title: "Teori",
        completedDates: ["2026-11-06"], // Checked from PC
        streakCurrent: 1,
        streakBest: 1,
      },
      {
        ...DEFAULT_HABITS[2],
        id: "habit-cloud-only",
        title: "Habit dari PC",
        completedDates: ["2026-11-05"],
      },
    ];

    const merged = mergeHabits(local, cloud);
    assert.equal(merged.length, 3); // habit-1, habit-local-only, habit-cloud-only

    const h1 = merged.find((h: any) => h.id === "habit-1");
    assert.ok(h1);
    // Should have union of dates: 2026-11-05, 2026-11-06, 2026-11-07 (3 consecutive days!)
    assert.deepEqual(h1.completedDates, ["2026-11-05", "2026-11-06", "2026-11-07"]);

    const localOnly = merged.find((h: any) => h.id === "habit-local-only");
    assert.ok(localOnly);

    const cloudOnly = merged.find((h: any) => h.id === "habit-cloud-only");
    assert.ok(cloudOnly);
  });

  it("does not resurrect deleted default starter habits when local is untouched, but keeps user custom habits", () => {
    // Cloud has only user's custom habit (user intentionally deleted default starter habits)
    const cloud = [
      {
        ...DEFAULT_HABITS[0],
        id: "habit-custom-coding",
        title: "Coding 1 Jam",
        completedDates: ["2026-11-01"],
      },
    ];

    // Local device has fresh DEFAULT_HABITS (0 checkins) and another custom habit
    const local = [
      ...DEFAULT_HABITS.map((d) => ({ ...d, completedDates: [] })),
      {
        ...DEFAULT_HABITS[0],
        id: "habit-custom-math",
        title: "Belajar Matematika",
        completedDates: ["2026-11-02"],
        _isLocalDraft: true,
      },
    ];

    const merged = mergeHabits(local, cloud);
    // Should contain habit-custom-coding and habit-custom-math, but NOT the untouched DEFAULT_HABITS!
    assert.equal(merged.length, 2);
    assert.ok(merged.some((h) => h.id === "habit-custom-coding"));
    assert.ok(merged.some((h) => h.id === "habit-custom-math"));
    assert.ok(!merged.some((h) => h.id === "habit-pomodoro"));
  });

  it("purges habits deleted on mobile from desktop and never resurrects them", () => {
    // Mobile deleted "cek-da", "sgdg", and "habit-pomodoro"
    // Cloud now only has the 4 active habits
    const cloud = [
      { ...DEFAULT_HABITS[2], id: "habit-buku", title: "Membaca Buku" },
      { ...DEFAULT_HABITS[0], id: "habit-english", title: "English everyday" },
      { ...DEFAULT_HABITS[1], id: "habit-public-speaking", title: "Learning Public Speaking" },
      { ...DEFAULT_HABITS[0], id: "habit-workout", title: "Workout, Ucikomi" },
    ];

    // Desktop's stale local storage still has the deleted habits
    const desktopLocal = [
      ...cloud,
      { ...DEFAULT_HABITS[0], id: "habit-cek-da", title: "cek da" },
      { ...DEFAULT_HABITS[0], id: "habit-sgdg", title: "sgdg" },
      { ...DEFAULT_HABITS[0], id: "habit-pomodoro", title: "Fokus 1 Sesi Pomodoro" },
    ];

    const deletedIds = ["habit-cek-da", "habit-sgdg", "habit-pomodoro"];

    const merged = mergeHabits(desktopLocal, cloud, deletedIds);

    // Desktop MUST only have the 4 active habits, and NONE of the deleted ones!
    assert.equal(merged.length, 4);
    assert.ok(!merged.some((h) => h.id === "habit-cek-da"));
    assert.ok(!merged.some((h) => h.id === "habit-sgdg"));
    assert.ok(!merged.some((h) => h.id === "habit-pomodoro"));
  });
});