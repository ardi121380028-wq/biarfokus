import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_SETTINGS, loadLocalSettings } from "./settings-service.ts";

describe("settings defaults", () => {
  it("provides stable defaults for a new user", () => {
    assert.deepEqual(DEFAULT_SETTINGS.timerDurations, {
      pomodoro: 1500,
      short: 300,
      long: 900,
    });
    assert.equal(DEFAULT_SETTINGS.soundEnabled, true);
  });

  it("uses defaults when browser storage is unavailable", () => {
    assert.deepEqual(loadLocalSettings(), DEFAULT_SETTINGS);
  });
});
