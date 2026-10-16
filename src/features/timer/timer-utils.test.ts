import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatTime, getRemainingSeconds, getTimerEndTime } from "./timer-utils.ts";

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
