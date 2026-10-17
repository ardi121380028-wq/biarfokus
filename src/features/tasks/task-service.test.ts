import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLocalTaskMigrationPayload,
  isUuid,
  mapDbTask,
  resolveFocusedTask,
} from "./task-service.ts";

describe("mapDbTask", () => {
  it("maps database task fields to the UI task model", () => {
    assert.deepEqual(mapDbTask({
      id: "task-1",
      title: "Ship MVP",
      completed: true,
      pomodoros: 3,
    }), {
      id: "task-1",
      title: "Ship MVP",
      done: true,
      pomodoros: 3,
    });
  });
});

describe("buildLocalTaskMigrationPayload", () => {
  it("sends only task content, in order, and never a user id", () => {
    const payload = buildLocalTaskMigrationPayload([
      { id: "local-1", title: "Pertama", done: false, pomodoros: 2 },
      { id: "local-2", title: "Kedua", done: true, pomodoros: 1 },
    ]);
    assert.deepEqual(payload, [
      { title: "Pertama", completed: false, pomodoros: 2 },
      { title: "Kedua", completed: true, pomodoros: 1 },
    ]);
  });
});

describe("resolveFocusedTask and isUuid", () => {
  const sampleTasks = [
    { id: "done-1", title: "Sudah beres", done: true, pomodoros: 2 },
    { id: "active-1", title: "Fokus utama", done: false, pomodoros: 3 },
    { id: "active-2", title: "Fokus kedua", done: false, pomodoros: 1 },
  ];

  it("prefers the explicitly selected incomplete task and falls back to the first active task", () => {
    assert.equal(resolveFocusedTask(sampleTasks, "active-2")?.id, "active-2");
    assert.equal(resolveFocusedTask(sampleTasks, "done-1")?.id, "active-1");
    assert.equal(resolveFocusedTask(sampleTasks, null)?.id, "active-1");
    assert.equal(resolveFocusedTask([sampleTasks[0]], "done-1"), null);
  });

  it("validates UUID strings before linking session task_id", () => {
    assert.equal(isUuid("550e8400-e29b-41d4-a716-446655440000"), true);
    assert.equal(isUuid("demo-1"), false);
    assert.equal(isUuid(null), false);
  });
});
