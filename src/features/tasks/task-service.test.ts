import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLocalTaskMigrationPayload, mapDbTask } from "./task-service.ts";

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
