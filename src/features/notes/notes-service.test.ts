import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterNotes,
  INITIAL_KEEP_NOTES,
  toggleChecklistItem,
} from "./notes-service.ts";
import type { KeepNote } from "../../types/domain.ts";

describe("notes-service", () => {
  it("filters notes by search query across title, content, items, and labels", () => {
    const results = filterNotes(INITIAL_KEEP_NOTES, "engraving");
    assert.equal(results.length, 1);
    assert.equal(results[0].title, "Todolist Bismillah - Work Zitline");

    const labelResults = filterNotes(INITIAL_KEEP_NOTES, "habit");
    assert.equal(labelResults.length, 1);
    assert.equal(labelResults[0].title, "Ide & Mindset Fokus Hari Ini");
  });

  it("filters notes by label chip", () => {
    const workNotes = filterNotes(INITIAL_KEEP_NOTES, "", "Work");
    assert.equal(workNotes.length, 1);
    assert.equal(workNotes[0].labels.includes("Work"), true);

    const ideNotes = filterNotes(INITIAL_KEEP_NOTES, "", "Ide");
    assert.equal(ideNotes.length, 1);
    assert.equal(ideNotes[0].labels.includes("Ide"), true);
  });

  it("toggles checklist items accurately without mutating others", () => {
    const initialNote: KeepNote = {
      id: "note-1",
      title: "Test Note",
      type: "checklist",
      color: "#ffffff",
      labels: [],
      updatedAt: "now",
      items: [
        { id: "item-a", text: "Buy milk", done: false },
        { id: "item-b", text: "Wash car", done: true },
      ],
    };

    const toggled = toggleChecklistItem([initialNote], "note-1", "item-a");
    assert.equal(toggled[0].items?.[0].done, true);
    assert.equal(toggled[0].items?.[1].done, true);

    const toggledBack = toggleChecklistItem(toggled, "note-1", "item-b");
    assert.equal(toggledBack[0].items?.[1].done, false);
  });
});
