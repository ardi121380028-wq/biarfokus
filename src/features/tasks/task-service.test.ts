import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLocalTaskMigrationPayload,
  deleteTaskLink,
  isUuid,
  loadTaskLinks,
  mapDbTask,
  resolveAuthoritativeTaskOrder,
  resolveFocusedTask,
  saveTaskLink,
  sortTasksByOrder,
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

  it("maps linked note metadata correctly", () => {
    assert.deepEqual(mapDbTask({
      id: "task-2",
      title: "Kerjakan Bab 2",
      completed: false,
      pomodoros: 2,
      linked_note_id: "note-123",
      linked_note_title: "Skripsi",
      linked_item_id: "item-456",
      linked_item_text: "Sub bab 2.1",
    }), {
      id: "task-2",
      title: "Kerjakan Bab 2",
      done: false,
      pomodoros: 2,
      linkedNoteId: "note-123",
      linkedNoteTitle: "Skripsi",
      linkedItemId: "item-456",
      linkedItemText: "Sub bab 2.1",
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

  it("prefers the explicitly selected incomplete task and returns null when unselected or done", () => {
    assert.equal(resolveFocusedTask(sampleTasks, "active-2")?.id, "active-2");
    assert.equal(resolveFocusedTask(sampleTasks, "done-1"), null);
    assert.equal(resolveFocusedTask(sampleTasks, null), null);
    assert.equal(resolveFocusedTask([sampleTasks[0]], "done-1"), null);
  });

  it("validates UUID strings before linking session task_id", () => {
    assert.equal(isUuid("550e8400-e29b-41d4-a716-446655440000"), true);
    assert.equal(isUuid("demo-1"), false);
    assert.equal(isUuid(null), false);
  });
});

describe("cross-device task order synchronization", () => {
  it("prefers newer cloud order from mobile over stale or legacy desktop localStorage order", () => {
    // Legacy desktop order without timestamp (updatedAt = 0) vs cloud order from phone
    const res1 = resolveAuthoritativeTaskOrder(
      ["t1", "t2", "t3"],
      0,
      ["t3", "t1", "t2"],
      1793244300000,
    );
    assert.equal(res1.source, "cloud");
    assert.deepEqual(res1.order, ["t3", "t1", "t2"]);

    // Older desktop timestamp vs newer phone cloud timestamp
    const res2 = resolveAuthoritativeTaskOrder(
      ["t1", "t2", "t3"],
      1000,
      ["t3", "t1", "t2"],
      2000,
    );
    assert.equal(res2.source, "cloud");
    assert.deepEqual(res2.order, ["t3", "t1", "t2"]);

    // Newer local in-flight drag vs older cloud timestamp keeps local order
    const res3 = resolveAuthoritativeTaskOrder(
      ["t2", "t3", "t1"],
      3000,
      ["t3", "t1", "t2"],
      2000,
    );
    assert.equal(res3.source, "local");
    assert.deepEqual(res3.order, ["t2", "t3", "t1"]);
  });

  it("sorts tasks by orderIds while keeping newly added tasks at the end", () => {
    const tasks = [
      { id: "t1", title: "Satu", done: false, pomodoros: 1 },
      { id: "t2", title: "Dua", done: false, pomodoros: 1 },
      { id: "t3", title: "Create Sosmed", done: false, pomodoros: 2 },
      { id: "t4", title: "Task Baru", done: false, pomodoros: 1 },
    ];
    const sorted = sortTasksByOrder(tasks, ["t3", "t1", "t2"]);
    assert.deepEqual(
      sorted.map((t) => t.id),
      ["t3", "t1", "t2", "t4"],
    );
  });
});

describe("task link storage", () => {
  it("safely handles environments without window", () => {
    assert.deepEqual(loadTaskLinks(), {});
  });

  it("saves, loads and deletes task links in localStorage when window exists", () => {
    const store = new Map<string, string>();
    const mockWindow = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
      },
    };
    (globalThis as unknown as { window?: unknown }).window = mockWindow;
    try {
      assert.deepEqual(loadTaskLinks(), {});
      saveTaskLink("task-123", {
        linkedNoteId: "note-1",
        linkedItemId: "item-1",
        linkedNoteTitle: "Test Note",
      });
      const loaded = loadTaskLinks();
      assert.equal(loaded["task-123"]?.linkedNoteId, "note-1");
      assert.equal(loaded["task-123"]?.linkedItemId, "item-1");

      deleteTaskLink("task-123");
      assert.deepEqual(loadTaskLinks(), {});
    } finally {
      delete (globalThis as unknown as { window?: unknown }).window;
    }
  });
});
