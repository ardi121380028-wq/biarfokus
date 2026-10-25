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
});
