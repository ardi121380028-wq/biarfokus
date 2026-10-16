import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateWeeklyStats } from "./stats-service.ts";

describe("calculateWeeklyStats", () => {
  it("aggregates only pomodoro sessions in the current week", () => {
    const stats = calculateWeeklyStats([
      { mode: "pomodoro", duration_seconds: 1500, completed_at: "2026-10-12T10:00:00.000Z" },
      { mode: "short", duration_seconds: 300, completed_at: "2026-10-13T10:00:00.000Z" },
      { mode: "pomodoro", duration_seconds: 2700, completed_at: "2026-10-18T10:00:00.000Z" },
    ], new Date("2026-10-16T12:00:00.000Z"));
    assert.equal(stats.focusSeconds, 1500);
    assert.equal(stats.pomodoroCount, 1);
    assert.equal(stats.dailyFocusSeconds[0], 1500);
  });
});
