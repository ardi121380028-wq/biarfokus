import type { ChecklistItem, KeepNote } from "../../types/domain.ts";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const NOTES_STORAGE_PREFIX = "biarfokus.keep_notes.";
export const LABELS_STORAGE_PREFIX = "biarfokus.keep_labels.";
export const MAX_LABEL_LENGTH = 30;

/** Starter labels offered in the label picker for brand new users. */
export const DEFAULT_LABELS: string[] = ["Work", "Kuliah", "Ide", "Habit"];

export const DEFAULT_NOTE_COLOR = "var(--paper)";

export const NOTE_COLORS = [
  { name: "Default", bg: DEFAULT_NOTE_COLOR, border: "color-mix(in srgb,var(--ink) 18%,transparent)" },
  { name: "Merah", bg: "#faafa8", border: "#f28b82" },
  { name: "Oranye", bg: "#f39f76", border: "#e8875c" },
  { name: "Kuning", bg: "#fff8b8", border: "#f6d860" },
  { name: "Hijau", bg: "#e2f6d3", border: "#a8d98a" },
  { name: "Teal", bg: "#b4ddd3", border: "#7fc4b3" },
  { name: "Biru", bg: "#d4e4ed", border: "#9fc3d9" },
  { name: "Ungu", bg: "#d3bfdb", border: "#b896c6" },
  { name: "Pink", bg: "#f6e2dd", border: "#e9bfb4" },
];

export const EMPTY_NOTES: KeepNote[] = [];

export type NoteDraft = Omit<KeepNote, "id" | "updatedAt">;

export function createEmptyDraft(type: KeepNote["type"] = "checklist"): NoteDraft {
  return { title: "", type, content: "", items: [], color: DEFAULT_NOTE_COLOR, labels: [], pinned: false };
}

export function isDefaultNoteColor(color?: string): boolean {
  return !color || color === DEFAULT_NOTE_COLOR;
}

/* ------------------------------------------------------------------ */
/* Ids & formatting                                                    */
/* ------------------------------------------------------------------ */

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatUpdatedAt(date: Date): string {
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/* ------------------------------------------------------------------ */
/* Labels                                                              */
/* ------------------------------------------------------------------ */

/** Trims, collapses whitespace and caps the length. Returns "" if invalid. */
export function normalizeLabel(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, MAX_LABEL_LENGTH);
}

export function findLabel(labels: string[], name: string): string | undefined {
  const needle = normalizeLabel(name).toLowerCase();
  return labels.find((l) => l.toLowerCase() === needle);
}

/** Stored labels + any label referenced by a note (keeps legacy data visible). */
export function mergeLabels(stored: string[], notes: KeepNote[]): string[] {
  const result = [...stored];
  for (const note of notes) {
    for (const label of note.labels) {
      if (!findLabel(result, label)) result.push(label);
    }
  }
  return result;
}

export function removeLabelFromNotes(notes: KeepNote[], label: string): KeepNote[] {
  const needle = label.toLowerCase();
  return notes.map((n) =>
    n.labels.some((l) => l.toLowerCase() === needle)
      ? { ...n, labels: n.labels.filter((l) => l.toLowerCase() !== needle) }
      : n,
  );
}

/* ------------------------------------------------------------------ */
/* Note operations                                                     */
/* ------------------------------------------------------------------ */

export function toggleChecklistItem(notes: KeepNote[], noteId: string, itemId: string): KeepNote[] {
  return notes.map((note) => {
    if (note.id !== noteId || !note.items) return note;
    return {
      ...note,
      items: note.items.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
    };
  });
}

/** Converts a note between text and checklist without losing content. */
export function convertDraftType(draft: NoteDraft, type: KeepNote["type"]): NoteDraft {
  if (draft.type === type) return draft;
  if (type === "checklist") {
    const items: ChecklistItem[] = (draft.content ?? "")
      .split("\n")
      .map((line) => line.replace(/^\s*(?:[-*•✓]|\d+[.)])\s*/, "").trim())
      .filter(Boolean)
      .map((text) => ({ id: createId("item"), text, done: false }));
    return { ...draft, type, items, content: "" };
  }
  const content = (draft.items ?? []).map((i) => i.text).join("\n");
  return { ...draft, type, content, items: [] };
}

export function isDraftEmpty(draft: NoteDraft): boolean {
  const hasTitle = draft.title.trim().length > 0;
  const hasText = draft.type === "text" && (draft.content ?? "").trim().length > 0;
  const hasItems = draft.type === "checklist" && (draft.items ?? []).some((i) => i.text.trim());
  return !hasTitle && !hasText && !hasItems;
}

/** Cleans up a draft before persisting (drops blank checklist rows, trims). */
export function finalizeDraft(draft: NoteDraft): NoteDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    content: draft.type === "text" ? (draft.content ?? "").trim() : "",
    items:
      draft.type === "checklist"
        ? (draft.items ?? []).map((i) => ({ ...i, text: i.text.trim() })).filter((i) => i.text)
        : [],
  };
}

export function filterNotes(notes: KeepNote[], searchQuery: string, activeLabel?: string | null): KeepNote[] {
  const q = searchQuery.trim().toLowerCase();
  return notes.filter((note) => {
    if (activeLabel && !note.labels.some((l) => l.toLowerCase() === activeLabel.toLowerCase())) return false;
    if (!q) return true;
    return (
      note.title.toLowerCase().includes(q) ||
      (note.content ?? "").toLowerCase().includes(q) ||
      (note.items ?? []).some((i) => i.text.toLowerCase().includes(q)) ||
      note.labels.some((l) => l.toLowerCase().includes(q))
    );
  });
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

export function getNotesStorageKey(userId?: string | null): string {
  return `${NOTES_STORAGE_PREFIX}${userId || "guest"}`;
}

export function getLabelsStorageKey(userId?: string | null): string {
  return `${LABELS_STORAGE_PREFIX}${userId || "guest"}`;
}

export function normalizeNote(raw: unknown): KeepNote | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string") return null;

  const items: ChecklistItem[] = Array.isArray(r.items)
    ? r.items
        .filter((it): it is Record<string, unknown> => !!it && typeof it === "object")
        .map((it) => ({
          id: typeof it.id === "string" ? it.id : createId("item"),
          text: typeof it.text === "string" ? it.text : "",
          done: Boolean(it.done),
        }))
    : [];

  const labels = Array.isArray(r.labels)
    ? r.labels.filter((l): l is string => typeof l === "string").map(normalizeLabel).filter(Boolean)
    : [];

  return {
    id: r.id,
    title: typeof r.title === "string" ? r.title : "",
    type: r.type === "checklist" ? "checklist" : "text",
    content: typeof r.content === "string" ? r.content : "",
    items,
    color: typeof r.color === "string" && r.color ? r.color : DEFAULT_NOTE_COLOR,
    labels,
    pinned: Boolean(r.pinned),
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : "",
  };
}

export function parseStoredNotes(raw: string | null): KeepNote[] {
  if (!raw) return EMPTY_NOTES;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_NOTES;
    return parsed.map(normalizeNote).filter((n): n is KeepNote => n !== null);
  } catch {
    return EMPTY_NOTES;
  }
}

export function parseStoredLabels(raw: string | null): string[] {
  if (!raw) return DEFAULT_LABELS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_LABELS;
    const result: string[] = [];
    for (const value of parsed) {
      if (typeof value !== "string") continue;
      const label = normalizeLabel(value);
      if (label && !findLabel(result, label)) result.push(label);
    }
    return result;
  } catch {
    return DEFAULT_LABELS;
  }
}
