import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeDisplayName } from "./profile-service.ts";

describe("normalizeDisplayName", () => {
  it("trims valid display names", () => {
    assert.equal(normalizeDisplayName("  Ardi  "), "Ardi");
  });

  it("rejects empty display names", () => {
    assert.throws(() => normalizeDisplayName("   "), /1 sampai 80/);
  });
});
