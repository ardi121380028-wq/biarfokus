import type { SupabaseClient } from "@supabase/supabase-js";
import type { KeepNote } from "@/types/domain";

const ARCHIVED_LABEL_SENTINEL = "__biarfokus_archived__";

type DbKeepNote = {
  id: string;
  user_id: string;
  title: string;
  type: string;
  content: string | null;
  items: unknown;
  color: string;
  labels: string[] | null;
  pinned: boolean;
  archived?: boolean | null;
  created_at: string;
  updated_at: string;
};

export function mapDbKeepNote(row: DbKeepNote): KeepNote {
  const rawLabels = Array.isArray(row.labels) ? row.labels : [];
  const hasArchivedSentinel = rawLabels.includes(ARCHIVED_LABEL_SENTINEL);
  const cleanLabels = rawLabels.filter((l) => l !== ARCHIVED_LABEL_SENTINEL);

  const archived =
    typeof row.archived === "boolean"
      ? Boolean(row.archived || hasArchivedSentinel)
      : hasArchivedSentinel;

  return {
    id: row.id,
    title: row.title || "",
    type: row.type === "text" ? "text" : "checklist",
    content: row.content || "",
    items: Array.isArray(row.items) ? (row.items as KeepNote["items"]) : [],
    color: row.color || "var(--paper)",
    labels: cleanLabels,
    pinned: Boolean(row.pinned),
    archived,
    updatedAt: new Date(row.updated_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export async function loadCloudNotes(
  supabase: SupabaseClient,
  userId: string,
): Promise<KeepNote[]> {
  const { data, error } = await supabase
    .from("keep_notes")
    .select("*")
    .eq("user_id", userId)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data as DbKeepNote[]) || []).map(mapDbKeepNote);
}

export async function upsertCloudNote(
  supabase: SupabaseClient,
  userId: string,
  note: KeepNote,
): Promise<void> {
  const cleanLabels = (note.labels || []).filter((l) => l !== ARCHIVED_LABEL_SENTINEL);
  const isArchived = Boolean(note.archived);
  const nowIso = new Date().toISOString();

  const fullPayload = {
    id: note.id,
    user_id: userId,
    title: note.title || "",
    type: note.type,
    content: note.content || "",
    items: note.items || [],
    color: note.color,
    labels: cleanLabels,
    pinned: Boolean(note.pinned),
    archived: isArchived,
    updated_at: nowIso,
  };

  const { error } = await supabase.from("keep_notes").upsert(fullPayload, { onConflict: "id" });
  if (!error) return;

  // Fallback when `archived` column migration has not yet been applied in Supabase:
  // persist archive status via hidden sentinel in `labels` so cloud sync works immediately
  const fallbackPayload = {
    id: note.id,
    user_id: userId,
    title: note.title || "",
    type: note.type,
    content: note.content || "",
    items: note.items || [],
    color: note.color,
    labels: isArchived ? [...cleanLabels, ARCHIVED_LABEL_SENTINEL] : cleanLabels,
    pinned: Boolean(note.pinned),
    updated_at: nowIso,
  };

  const { error: fallbackError } = await supabase.from("keep_notes").upsert(fallbackPayload, { onConflict: "id" });
  if (fallbackError) throw fallbackError;
}

export async function deleteCloudNote(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
): Promise<void> {
  const { error } = await supabase
    .from("keep_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function loadCloudLabels(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("keep_labels")
    .select("name")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;
  return ((data as Array<{ name: string }>) || [])
    .map((row) => row.name)
    .filter((name) => name !== ARCHIVED_LABEL_SENTINEL);
}

export async function insertCloudLabel(
  supabase: SupabaseClient,
  userId: string,
  label: string,
): Promise<void> {
  const { error } = await supabase
    .from("keep_labels")
    .upsert({ user_id: userId, name: label }, { onConflict: "user_id, name" });

  if (error) throw error;
}

export async function deleteCloudLabel(
  supabase: SupabaseClient,
  userId: string,
  label: string,
): Promise<void> {
  const { error } = await supabase
    .from("keep_labels")
    .delete()
    .eq("user_id", userId)
    .ilike("name", label);

  if (error) throw error;
}
