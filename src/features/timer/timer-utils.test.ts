import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatTime,
  getCycleProgress,
  getNextTimerMode,
  getRemainingSeconds,
  getTimerEndTime,
} from "./timer-utils.ts";

describe("formatTime", () => {
  it("formats minutes and seconds with leading zeroes", () => {
    assert.equal(formatTime(1482), "24:42");
  });

  it("formats a zero duration", () => {
    assert.equal(formatTime(0), "00:00");
  });
});

describe("timestamp timer calculations", () => {
  it("creates an absolute end time from a duration", () => {
    assert.equal(getTimerEndTime(25, 1000), 26000);
  });

  it("returns elapsed time based on the absolute end time", () => {
    assert.equal(getRemainingSeconds(26000, 11200), 15);
    assert.equal(getRemainingSeconds(26000, 27000), 0);
  });
});

describe("pomodoro cycle transitions", () => {
  it("transitions to short break on pomodoros 1..3 and long break on every 4th pomodoro", () => {
    assert.equal(getNextTimerMode("pomodoro", 1), "short");
    assert.equal(getNextTimerMode("pomodoro", 2), "short");
    assert.equal(getNextTimerMode("pomodoro", 3), "short");
    assert.equal(getNextTimerMode("pomodoro", 4), "long");
    assert.equal(getNextTimerMode("pomodoro", 8), "long");
  });

  it("always transitions back to pomodoro after short or long break", () => {
    assert.equal(getNextTimerMode("short", 2), "pomodoro");
    assert.equal(getNextTimerMode("long", 4), "pomodoro");
  });

  it("computes cycle number and progress within the 4-pomodoro cycle", () => {
    assert.deepEqual(getCycleProgress(0), { cycleNumber: 1, completedInCycle: 0, totalInCycle: 4 });
    assert.deepEqual(getCycleProgress(3), { cycleNumber: 1, completedInCycle: 3, totalInCycle: 4 });
    assert.deepEqual(getCycleProgress(4), { cycleNumber: 2, completedInCycle: 0, totalInCycle: 4 });
    assert.deepEqual(getCycleProgress(5), { cycleNumber: 2, completedInCycle: 1, totalInCycle: 4 });
  });
});
