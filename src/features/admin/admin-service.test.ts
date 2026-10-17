import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateAdminMetrics,
  isAdminRole,
  normalizeUserRole,
  validateAuditAction,
} from "./admin-service.ts";

describe("admin role authorization helpers", () => {
  it("normalizes unknown or regular roles to user and preserves admin", () => {
    assert.equal(normalizeUserRole("admin"), "admin");
    assert.equal(normalizeUserRole("user"), "user");
    assert.equal(normalizeUserRole(null), "user");
    assert.equal(normalizeUserRole("superadmin"), "user");
    assert.equal(isAdminRole("admin"), true);
    assert.equal(isAdminRole("user"), false);
  });

  it("validates and trims audit log action and targetType", () => {
    const validated = validateAuditAction("  refresh_overview  ", "  dashboard  ");
    assert.deepEqual(validated, {
      action: "refresh_overview",
      targetType: "dashboard",
    });
    assert.throws(() => validateAuditAction("   ", "dashboard"), /1 sampai 120/);
    assert.throws(() => validateAuditAction("refresh_overview", "   "), /1 sampai 80/);
  });

  it("calculates real admin overview metrics and deduplicates active users today", () => {
    const overview = calculateAdminMetrics({
      totalUsers: 12,
      sessionsToday: [
        { user_id: "user-1" },
        { user_id: "user-1" },
        { user_id: "user-2" },
      ],
      completedPomodoros: 45,
      tasks: [{ completed: true }, { completed: false }, { completed: true }],
      auditLogs: [],
    });

    assert.equal(overview.totalUsers, 12);
    assert.equal(overview.activeUsersToday, 2);
    assert.equal(overview.completedPomodoros, 45);
    assert.equal(overview.totalTasks, 3);
    assert.equal(overview.completedTasks, 2);
    assert.deepEqual(overview.auditLogs, []);
  });
});
