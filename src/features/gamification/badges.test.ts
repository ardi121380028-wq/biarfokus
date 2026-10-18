import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateBadges } from "./badges.ts";

describe("evaluateBadges", () => {
  it("unlocks first pomodoro and computes progress correctly", () => {
    const badges = evaluateBadges({
      totalPomodoros: 1,
      currentStreak: 1,
      longestStreak: 1,
      deepWorkCount: 0,
    });

    const first = badges.find((b) => b.id === "first_pomodoro");
    assert.equal(first?.unlocked, true);
    assert.equal(first?.progressPercent, 100);

    const ten = badges.find((b) => b.id === "pomodoros_10");
    assert.equal(ten?.unlocked, false);
    assert.equal(ten?.progressPercent, 10);
  });

  it("unlocks streak badges based on longestStreak", () => {
    const badges = evaluateBadges({
      totalPomodoros: 25,
      currentStreak: 2,
      longestStreak: 7,
      deepWorkCount: 1,
    });

    const streak3 = badges.find((b) => b.id === "streak_3");
    const streak7 = badges.find((b) => b.id === "streak_7");
    const deepWork = badges.find((b) => b.id === "deep_work");

    assert.equal(streak3?.unlocked, true);
    assert.equal(streak7?.unlocked, true);
    assert.equal(deepWork?.unlocked, true);
  });
});
