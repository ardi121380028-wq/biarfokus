import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  apiJson,
  createRateLimiter,
  formatApiError,
  getClientKey,
  rateLimitResponse,
  resolveCorrelationId,
  serializeError,
} from "./request-guard.ts";

describe("resolveCorrelationId", () => {
  it("reuses a well-formed incoming id and rejects unsafe ones", () => {
    assert.equal(resolveCorrelationId("req-12345678"), "req-12345678");
    const generated = resolveCorrelationId("bad id\nwith newline");
    assert.notEqual(generated, "bad id\nwith newline");
    assert.match(generated, /^[0-9a-f-]{36}$/);
    assert.match(resolveCorrelationId(null), /^[0-9a-f-]{36}$/);
  });
});

describe("getClientKey", () => {
  it("prefers the first x-forwarded-for entry, then x-real-ip, then unknown", () => {
    assert.equal(getClientKey(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })), "1.2.3.4");
    assert.equal(getClientKey(new Headers({ "x-real-ip": "5.6.7.8" })), "5.6.7.8");
    assert.equal(getClientKey(new Headers()), "unknown");
  });
});

describe("createRateLimiter", () => {
  it("allows up to the limit per window and then blocks with a retry delay", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    assert.deepEqual(limiter.check("ip", 0), { allowed: true, remaining: 1, retryAfterSeconds: 0 });
    assert.deepEqual(limiter.check("ip", 1_000), { allowed: true, remaining: 0, retryAfterSeconds: 0 });
    assert.deepEqual(limiter.check("ip", 10_000), { allowed: false, remaining: 0, retryAfterSeconds: 50 });
  });

  it("starts a fresh window after it expires and tracks keys independently", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000 });
    assert.equal(limiter.check("a", 0).allowed, true);
    assert.equal(limiter.check("a", 500).allowed, false);
    assert.equal(limiter.check("b", 500).allowed, true);
    assert.equal(limiter.check("a", 1_000).allowed, true);
  });

  it("evicts old keys instead of growing without bound", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 2 });
    limiter.check("a", 0);
    limiter.check("b", 0);
    limiter.check("c", 0);
    assert.equal(limiter.check("a", 1).allowed, true);
  });
});

describe("api responses", () => {
  it("always sets x-correlation-id and echoes it in the body only for 5xx", async () => {
    const ok = apiJson({ data: 1 }, { correlationId: "corr-0001" });
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get("x-correlation-id"), "corr-0001");
    assert.deepEqual(await ok.json(), { data: 1 });

    const denied = apiJson({ error: "no" }, { status: 403, correlationId: "corr-0002" });
    assert.deepEqual(await denied.json(), { error: "no" });

    const failed = apiJson({ error: "boom" }, { status: 500, correlationId: "corr-0003" });
    assert.deepEqual(await failed.json(), { error: "boom", correlationId: "corr-0003" });
  });

  it("builds a 429 response with Retry-After", async () => {
    const response = rateLimitResponse(
      { allowed: false, remaining: 0, retryAfterSeconds: 42 },
      "corr-0004",
    );
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("retry-after"), "42");
    assert.match(((await response.json()) as { error: string }).error, /42 detik/);
  });
});

describe("error helpers", () => {
  it("serializes errors without leaking stack traces", () => {
    assert.deepEqual(serializeError(new TypeError("gagal")), { name: "TypeError", message: "gagal" });
    assert.deepEqual(serializeError({ message: "db error" }), { name: "Error", message: "db error" });
    assert.deepEqual(serializeError(42), { name: "UnknownError", message: "42" });
  });

  it("appends the support reference only when the server provided one", () => {
    assert.equal(formatApiError({ error: "Gagal" }, "fallback"), "Gagal");
    assert.equal(formatApiError({}, "fallback"), "fallback");
    assert.equal(
      formatApiError({ error: "Gagal", correlationId: "corr-0005" }, "fallback"),
      "Gagal (ref: corr-0005)",
    );
  });
});
