import type { ChecklistItem, KeepNote } from "../../types/domain.ts";

export const NOTES_STORAGE_PREFIX = "biarfokus.keep_notes.";

export const DEFAULT_LABELS = [
  "The Frog",
  "Batching",
  "Work",
  "Habit",
  "Ide",
  "Kuliah",
];

export const NOTE_COLORS = [
  { name: "Default", bg: "var(--paper)", border: "color-mix(in srgb,var(--ink) 12%,transparent)" },
  { name: "Biru", bg: "#dbeafe", border: "#93c5fd" },
  { name: "Kuning", bg: "#fef9c3", border: "#fde047" },
  { name: "Hijau", bg: "#dcfce7", border: "#86efac" },
  { name: "Oranye", bg: "#ffedd5", border: "#fdba74" },
  { name: "Ungu", bg: "#f3e8ff", border: "#d8b4fe" },
  { name: "Merah Muda", bg: "#ffe4e6", border: "#fda4af" },
  { name: "Teal", bg: "#ccfbf1", border: "#5eead4" },
];

export const INITIAL_KEEP_NOTES: KeepNote[] = [
  {
    id: "sample_note_work_zitline",
    title: "Todolist Bismillah - Work Zitline",
    type: "checklist",
    items: [
      { id: "item-1", text: "The Frog: List mesin engraving laser, buat pengajuan", done: false },
      { id: "item-2", text: "Batching: Evaluasi sosmed dan design dan lainnya", done: false },
      { id: "item-3", text: "Website Halal Wireframe-UI Design", done: false },
      { id: "item-4", text: "Upload Video ke tt dan youtube", done: false },
      { id: "item-5", text: "Sertifikat Kyu", done: false },
      { id: "item-6", text: "Planning For Konten - awareness but tetap profesional", done: false },
      { id: "item-7", text: "Template hotspot modern elegan", done: true },
      { id: "item-8", text: "Video ziva - rs urip", done: true },
    ],
    color: "#dbeafe",
    labels: ["Work", "The Frog", "Batching"],
    pinned: true,
    updatedAt: "18 Okt, 20:30",
  },
  {
    id: "sample_note_fokus",
    title: "Ide & Mindset Fokus Hari Ini",
    type: "text",
    content: "1. Telan katak terbesar di pagi hari (Eat That Frog).\n2. Batching tugas-tugas kecil di siang hari.\n3. Lindungi deep work block dari distraksi sosmed dan notifikasi.",
    color: "#fef9c3",
    labels: ["Ide", "Habit"],
    pinned: false,
    updatedAt: "18 Okt, 14:15",
  },
];

export function getNotesStorageKey(userId?: string | null): string {
  return `${NOTES_STORAGE_PREFIX}${userId || "guest"}`;
}

export function loadKeepNotes(userId?: string | null): KeepNote[] {
  if (typeof window === "undefined") {
    return INITIAL_KEEP_NOTES;
  }
  try {
    const raw = window.localStorage.getItem(getNotesStorageKey(userId));
    if (!raw) return INITIAL_KEEP_NOTES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_KEEP_NOTES;
    // Normalize existing notes if they were in the previous format
    return parsed.map((item: any) => ({
      id: item.id || `note_${Date.now()}`,
      title: item.title || "",
      type: item.type === "checklist" ? "checklist" : "text",
      content: typeof item.content === "string" ? item.content : "",
      items: Array.isArray(item.items)
        ? item.items.map((it: any) => ({
            id: it.id || `item_${Math.random()}`,
            text: it.text || "",
            done: Boolean(it.done),
          }))
        : [],
      color: item.color || NOTE_COLORS[0].bg,
      labels: Array.isArray(item.labels) ? item.labels : [],
      pinned: Boolean(item.pinned),
      updatedAt: item.updatedAt || "",
    }));
  } catch {
    return INITIAL_KEEP_NOTES;
  }
}

export function saveKeepNotes(notes: KeepNote[], userId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getNotesStorageKey(userId), JSON.stringify(notes));
  } catch {
    // Ignore storage quota errors
  }
}

export function toggleChecklistItem(
  notes: KeepNote[],
  noteId: string,
  itemId: string
): KeepNote[] {
  return notes.map((note) => {
    if (note.id !== noteId || !note.items) return note;
    return {
      ...note,
      items: note.items.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      ),
    };
  });
}

export function filterNotes(
  notes: KeepNote[],
  searchQuery: string,
  activeLabel?: string | null
): KeepNote[] {
  const q = searchQuery.trim().toLowerCase();
  return notes.filter((note) => {
    // Filter by label if selected
    if (activeLabel && activeLabel !== "Semua") {
      if (!note.labels || !note.labels.includes(activeLabel)) {
        return false;
      }
    }
    // Filter by search query
    if (!q) return true;
    const titleMatch = note.title.toLowerCase().includes(q);
    const contentMatch = note.content?.toLowerCase().includes(q);
    const itemsMatch = note.items?.some((i) => i.text.toLowerCase().includes(q));
    const labelsMatch = note.labels?.some((l) => l.toLowerCase().includes(q));
    return Boolean(titleMatch || contentMatch || itemsMatch || labelsMatch);
  });
}
