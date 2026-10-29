import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  convertDraftType,
  filterNotes,
  findLabel,
  mergeCloudNotes,
  mergeLabels,
  normalizeLabel,
  parseStoredLabels,
  parseStoredNotes,
  removeLabelFromNotes,
  setChecklistItemStatus,
  toggleChecklistItem,
} from "./notes-service.ts";
import type { KeepNote } from "../../types/domain.ts";

describe("notes-service", () => {
  const sampleNotes: KeepNote[] = [
    {
      id: "note-1",
      title: "Pekerjaan Proyek",
      type: "checklist",
      items: [
        { id: "item-1", text: "Kirim invoice", done: false },
        { id: "item-2", text: "Review desain", done: true },
      ],
      color: "#faafa8",
      labels: ["Work", "Urgent"],
      pinned: true,
      updatedAt: "18 Okt, 20:00",
    },
    {
      id: "note-2",
      title: "Ide Konten Baru",
      type: "text",
      content: "Bikin video tutorial time blocking dan teknik pomodoro.",
      color: "#fff8b8",
      labels: ["Ide"],
      pinned: false,
      updatedAt: "18 Okt, 21:00",
    },
  ];

  it("normalizes, finds, merges and removes labels accurately", () => {
    assert.equal(normalizeLabel("  The   Frog  "), "The Frog");
    assert.equal(findLabel(["Work", "Kuliah"], "work"), "Work");
    assert.equal(findLabel(["Work", "Kuliah"], "nonexistent"), undefined);

    const merged = mergeLabels(["Work"], sampleNotes);
    assert.equal(merged.includes("Work"), true);
    assert.equal(merged.includes("Urgent"), true);
    assert.equal(merged.includes("Ide"), true);

    const cleaned = removeLabelFromNotes(sampleNotes, "urgent");
    assert.equal(cleaned[0].labels.includes("Urgent"), false);
  });

  it("converts draft between text and checklist smoothly", () => {
    const textDraft = {
      title: "Todo",
      type: "text" as const,
      content: "- Beli susu\n- Cuci mobil",
      color: "var(--paper)",
      labels: [],
      pinned: false,
    };
    const checklistDraft = convertDraftType(textDraft, "checklist");
    assert.equal(checklistDraft.type, "checklist");
    assert.equal(checklistDraft.items?.length, 2);
    assert.equal(checklistDraft.items?.[0].text, "Beli susu");

    const backToText = convertDraftType(checklistDraft, "text");
    assert.equal(backToText.type, "text");
    assert.equal(backToText.content?.includes("Beli susu"), true);
  });

  it("filters notes by search query across title, content, items, and labels", () => {
    const results = filterNotes(sampleNotes, "invoice");
    assert.equal(results.length, 1);
    assert.equal(results[0].id, "note-1");

    const labelResults = filterNotes(sampleNotes, "", "Ide");
    assert.equal(labelResults.length, 1);
    assert.equal(labelResults[0].id, "note-2");
  });

  it("filters notes by archived flag", () => {
    const mixedNotes: KeepNote[] = [
      { ...sampleNotes[0], archived: false },
      { ...sampleNotes[1], archived: true },
    ];
    const active = filterNotes(mixedNotes, "", null, false);
    assert.equal(active.length, 1);
    assert.equal(active[0].id, "note-1");

    const archived = filterNotes(mixedNotes, "", null, true);
    assert.equal(archived.length, 1);
    assert.equal(archived[0].id, "note-2");
  });

  it("merges cloud notes while preserving archived state if DB column is not migrated yet", () => {
    const localNotes: KeepNote[] = [
      { ...sampleNotes[0], archived: true },
      { ...sampleNotes[1], archived: false },
    ];

    // Case 1: DB does not have `archived` column yet (`archived` is undefined)
    const cloudWithoutArchivedColumn: KeepNote[] = [
      { ...sampleNotes[0], archived: undefined },
      { ...sampleNotes[1], archived: undefined },
    ];
    const mergedFallback = mergeCloudNotes(cloudWithoutArchivedColumn, localNotes);
    assert.equal(mergedFallback[0].archived, true);
    assert.equal(mergedFallback[1].archived, false);

    // Case 2: DB has `archived` column (`archived` is boolean) -> cloud is authoritative
    const cloudWithArchivedColumn: KeepNote[] = [
      { ...sampleNotes[0], archived: false },
      { ...sampleNotes[1], archived: true },
    ];
    const mergedAuthoritative = mergeCloudNotes(cloudWithArchivedColumn, localNotes);
    assert.equal(mergedAuthoritative[0].archived, false);
    assert.equal(mergedAuthoritative[1].archived, true);
  });

  it("toggles checklist item done status", () => {
    const toggled = toggleChecklistItem(sampleNotes, "note-1", "item-1");
    assert.equal(toggled[0].items?.[0].done, true);

    const toggledBack = toggleChecklistItem(toggled, "note-1", "item-1");
    assert.equal(toggledBack[0].items?.[0].done, false);
  });

  it("sets checklist item status explicitly without toggling inversion", () => {
    const setDone = setChecklistItemStatus(sampleNotes, "note-1", "item-1", true);
    assert.equal(setDone[0].items?.[0].done, true);

    // Idempotent: setting it again to true stays true
    const setDoneAgain = setChecklistItemStatus(setDone, "note-1", "item-1", true);
    assert.equal(setDoneAgain[0].items?.[0].done, true);

    const setUndone = setChecklistItemStatus(setDoneAgain, "note-1", "item-1", false);
    assert.equal(setUndone[0].items?.[0].done, false);
  });

  it("defaults to empty array on empty or corrupt storage", () => {
    assert.deepEqual(parseStoredNotes(null), []);
    assert.deepEqual(parseStoredNotes(""), []);
    assert.deepEqual(parseStoredNotes("not json"), []);
  });

  it("parses stored labels with fallback to default labels", () => {
    assert.deepEqual(parseStoredLabels(null), ["Work", "Kuliah", "Ide", "Habit"]);
    assert.deepEqual(parseStoredLabels(JSON.stringify(["Urgent", "Personal"])), ["Urgent", "Personal"]);
  });
});
