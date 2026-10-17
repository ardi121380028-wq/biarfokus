import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  assertTaskLimitAllowed,
  FREE_ACTIVE_TASK_LIMIT,
  isProSubscription,
  mapStripeStatusToSubscription,
  normalizeSubscription,
} from "./billing-service.ts";
import { verifyStripeWebhookSignature } from "./stripe-webhook.ts";

describe("billing and subscription rules", () => {
  it("normalizes missing or invalid subscription payloads to free/inactive", () => {
    const sub = normalizeSubscription(null, "user-123");
    assert.equal(sub.user_id, "user-123");
    assert.equal(sub.plan, "free");
    assert.equal(sub.status, "inactive");
  });

  it("evaluates active Pro subscription status and expiration accurately", () => {
    const now = new Date("2026-10-17T00:00:00.000Z");
    assert.equal(
      isProSubscription(
        {
          plan: "pro",
          status: "active",
          current_period_end: "2026-11-17T00:00:00.000Z",
        },
        now,
      ),
      true,
    );
    assert.equal(
      isProSubscription(
        {
          plan: "pro",
          status: "active",
          current_period_end: "2026-10-16T00:00:00.000Z",
        },
        now,
      ),
      false,
    );
    assert.equal(
      isProSubscription(
        {
          plan: "free",
          status: "inactive",
          current_period_end: null,
        },
        now,
      ),
      false,
    );
  });

  it("enforces Free active task limit while allowing unlimited tasks for Pro", () => {
    assert.doesNotThrow(() =>
      assertTaskLimitAllowed(FREE_ACTIVE_TASK_LIMIT - 1, false),
    );
    assert.throws(
      () => assertTaskLimitAllowed(FREE_ACTIVE_TASK_LIMIT, false),
      /Batas paket Free tercapai/,
    );
    assert.doesNotThrow(() =>
      assertTaskLimitAllowed(FREE_ACTIVE_TASK_LIMIT + 50, true),
    );
  });

  it("maps Stripe subscription statuses and verifies webhook HMAC signatures", () => {
    assert.deepEqual(mapStripeStatusToSubscription("active"), {
      plan: "pro",
      status: "active",
    });
    assert.deepEqual(mapStripeStatusToSubscription("canceled"), {
      plan: "free",
      status: "canceled",
    });

    const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
    const secret = "whsec_test_secret";
    const timestamp = 1792220000;
    const sig = createHmac("sha256", secret)
      .update(`${timestamp}.${payload}`, "utf8")
      .digest("hex");

    assert.equal(
      verifyStripeWebhookSignature(
        payload,
        `t=${timestamp},v1=${sig}`,
        secret,
        timestamp + 10,
      ),
      true,
    );
    assert.equal(
      verifyStripeWebhookSignature(
        payload,
        `t=${timestamp},v1=deadbeef`,
        secret,
        timestamp + 10,
      ),
      false,
    );
  });
});
