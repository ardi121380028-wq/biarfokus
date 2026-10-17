import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSafeAvatarUrl, normalizeDisplayName } from "./profile-service.ts";

describe("normalizeDisplayName", () => {
  it("trims valid display names", () => {
    assert.equal(normalizeDisplayName("  Ardi  "), "Ardi");
  });

  it("rejects empty display names", () => {
    assert.throws(() => normalizeDisplayName("   "), /1 sampai 80/);
  });
});

describe("getSafeAvatarUrl", () => {
  it("accepts https URLs", () => {
    assert.equal(
      getSafeAvatarUrl("https://lh3.googleusercontent.com/a/photo=s96-c"),
      "https://lh3.googleusercontent.com/a/photo=s96-c",
    );
  });

  it("rejects non-https, malformed, and non-string values", () => {
    assert.equal(getSafeAvatarUrl("http://example.com/a.png"), null);
    assert.equal(getSafeAvatarUrl("javascript:alert(1)"), null);
    assert.equal(getSafeAvatarUrl("/relative/avatar.png"), null);
    assert.equal(getSafeAvatarUrl(""), null);
    assert.equal(getSafeAvatarUrl(undefined), null);
    assert.equal(getSafeAvatarUrl(42), null);
  });
});
