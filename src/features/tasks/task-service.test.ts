import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLocalTaskMigrationPayload,
  deleteTaskLink,
  isUuid,
  loadTaskLinks,
  mapDbTask,
  resolveFocusedTask,
  saveTaskLink,
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
