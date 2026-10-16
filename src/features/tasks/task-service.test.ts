import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapDbTask } from "./task-service.ts";

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
