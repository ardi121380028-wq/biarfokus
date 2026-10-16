import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatTime } from "./timer-utils.ts";

describe("formatTime", () => {
  it("formats minutes and seconds with leading zeroes", () => {
    assert.equal(formatTime(1482), "24:42");
  });

  it("formats a zero duration", () => {
    assert.equal(formatTime(0), "00:00");
  });
});
