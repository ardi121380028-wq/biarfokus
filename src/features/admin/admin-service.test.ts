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
    assert.equal(overview.totalPageViews, 0);
    assert.equal(overview.pageViewsToday, 0);
    assert.equal(overview.uniqueVisitorsToday, 0);
    assert.equal(overview.dailyVisits.length, 7);
    assert.deepEqual(overview.auditLogs, []);
  });

  it("calculates traffic metrics, unique visitors, and daily visit series", () => {
    const fixedNow = new Date("2026-10-18T15:00:00.000Z");
    const overview = calculateAdminMetrics(
      {
        totalUsers: 5,
        sessionsToday: [{ user_id: "user-1" }],
        completedPomodoros: 10,
        tasks: [{ completed: true }],
        totalPageViews: 150,
        recentVisits: [
          { created_at: "2026-10-18T08:00:00.000Z", visitor_id: "vis-1" },
          { created_at: "2026-10-18T09:30:00.000Z", visitor_id: "vis-1" },
          { created_at: "2026-10-18T10:00:00.000Z", visitor_id: "vis-2" },
          { created_at: "2026-10-17T12:00:00.000Z", visitor_id: "vis-3" },
        ],
        auditLogs: [],
      },
      fixedNow,
    );

    assert.equal(overview.totalPageViews, 150);
    assert.equal(overview.pageViewsToday, 3);
    assert.equal(overview.uniqueVisitorsToday, 2); // vis-1, vis-2
    assert.equal(overview.uniqueVisitorsTotal, 3); // vis-1, vis-2, vis-3
    assert.equal(overview.dailyVisits.length, 7);
    const todayEntry = overview.dailyVisits.find((v) => v.date === "2026-10-18");
    assert.ok(todayEntry);
    assert.equal(todayEntry.pageViews, 3);
    assert.equal(todayEntry.uniqueVisitors, 2);
  });
});
