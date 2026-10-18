import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_SETTINGS, loadLocalSettings, normalizeSettings } from "./settings-service.ts";

describe("settings defaults", () => {
  it("provides stable defaults for a new user", () => {
    assert.deepEqual(DEFAULT_SETTINGS.timerDurations, {
      pomodoro: 1500,
      short: 300,
      long: 900,
    });
    assert.equal(DEFAULT_SETTINGS.soundEnabled, true);
    assert.equal(DEFAULT_SETTINGS.alarmSound, "bell");
    assert.equal(DEFAULT_SETTINGS.longBreakInterval, 4);
  });

  it("uses defaults when browser storage is unavailable", () => {
    assert.deepEqual(loadLocalSettings(), DEFAULT_SETTINGS);
  });

  it("normalizes incomplete settings safely", () => {
    const normalized = normalizeSettings({
      selectedColor: "#f77fa5",
      alarmSound: "zen",
      longBreakInterval: 6,
    });
    assert.equal(normalized.selectedColor, "#f77fa5");
    assert.equal(normalized.alarmSound, "zen");
    assert.equal(normalized.longBreakInterval, 6);
    assert.equal(normalized.autoStart, false);
    assert.equal(normalized.soundEnabled, true);
  });
});
